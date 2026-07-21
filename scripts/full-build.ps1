# CS2 Bot Improver Assistant - Full Build & Package Script
# 完整构建和打包脚本 - 从源码到安装包
param(
    [switch]$SkipResourceDownload,
    [switch]$SkipTypeCheck,
    [switch]$SkipTest,
    [switch]$SkipDesktopBuild,
    [switch]$CreateReleasePackage
)

$ErrorActionPreference = "Stop"
$ProjectRoot = $PSScriptRoot | Split-Path -Parent
$BuildLog = Join-Path $ProjectRoot "build.log"

function Write-Step {
    param([string]$Message)
    $timestamp = Get-Date -Format "HH:mm:ss"
    Write-Host "[$timestamp] $Message" -ForegroundColor Cyan
    "[$timestamp] $Message" | Out-File $BuildLog -Append
}

function Write-OK {
    param([string]$Message)
    Write-Host "  [OK] $Message" -ForegroundColor Green
    "  [OK] $Message" | Out-File $BuildLog -Append
}

function Write-ERR {
    param([string]$Message)
    Write-Host "  [ERROR] $Message" -ForegroundColor Red
    "  [ERROR] $Message" | Out-File $BuildLog -Append
}

"" | Out-File $BuildLog
Set-Location $ProjectRoot

Write-Step "=== CS2 Bot Improver Assistant - Build v1.0.0 ==="
Write-Step "Project root: $ProjectRoot"

# Check prerequisites
Write-Step "Checking prerequisites..."
$nodeVersion = node --version
Write-OK "Node.js $nodeVersion"
$npmVersion = npm --version
Write-OK "npm $npmVersion"

try {
    $rustVersion = rustc --version
    Write-OK "Rust: $rustVersion"
} catch {
    Write-ERR "Rust not installed! Desktop build will fail."
    Write-ERR "Install Rust from https://rustup.rs"
}

# Step 1: Install dependencies
Write-Step "[1/7] Installing npm dependencies..."
npm install 2>&1 | Out-Null
Write-OK "npm install complete"

# Step 2: Typecheck
if (-not $SkipTypeCheck) {
    Write-Step "[2/7] Running typecheck..."
    npm run typecheck 2>&1 | Out-File "$ProjectRoot\typecheck_output.txt"
    if ($LASTEXITCODE -eq 0) {
        Write-OK "Typecheck passed"
    } else {
        Write-ERR "Typecheck failed! See typecheck_output.txt"
        Get-Content "$ProjectRoot\typecheck_output.txt" -Tail 20
        exit 1
    }
}

# Step 3: Lint
Write-Step "[3/7] Running lint..."
npm run lint 2>&1 | Out-File "$ProjectRoot\lint_output.txt"
if ($LASTEXITCODE -eq 0) {
    Write-OK "Lint passed"
} else {
    Write-ERR "Lint warnings found. Continuing..."
}

# Step 4: Run tests
if (-not $SkipTest) {
    Write-Step "[4/7] Running tests..."
    npm run test 2>&1 | Out-File "$ProjectRoot\test_output.txt"
    if ($LASTEXITCODE -eq 0) {
        Write-OK "Tests passed"
    } else {
        Write-ERR "Some tests failed! See test_output.txt"
    }
}

# Step 5: Build resource ZIP
Write-Step "[5/7] Building resource package..."
$resourceScript = Join-Path $ProjectRoot "scripts\build-resource-zip.ps1"
$resourceZip = Join-Path $ProjectRoot "src-tauri\resources\CS2BotImprover.zip"

if ($SkipResourceDownload) {
    if (-not (Test-Path $resourceZip)) {
        Write-ERR "CS2BotImprover.zip not found and SkipResourceDownload is set!"
        Write-ERR "Download and build it first: scripts\build-resource-zip.ps1"
        exit 1
    }
    Write-OK "Using existing $resourceZip ($((Get-Item $resourceZip).Length) bytes)"
} else {
    & $resourceScript -OutputDir "$ProjectRoot\src-tauri\resources"
    if ($LASTEXITCODE -eq 0 -and (Test-Path $resourceZip)) {
        Write-OK "Resource ZIP built: $((Get-Item $resourceZip).Length) bytes"
        Write-OK "SHA256: $((Get-FileHash $resourceZip -Algorithm SHA256).Hash)"
    } else {
        Write-ERR "Resource ZIP build failed!"
        exit 1
    }
}

# Step 6: Build web frontend
Write-Step "[6/7] Building web frontend..."
npm run build:web 2>&1 | Out-File "$ProjectRoot\web_build_output.txt"
if ($LASTEXITCODE -eq 0) {
    Write-OK "Web build complete"
} else {
    Write-ERR "Web build failed!"
    Get-Content "$ProjectRoot\web_build_output.txt" -Tail 20
    exit 1
}

# Step 7: Build desktop
if (-not $SkipDesktopBuild) {
    Write-Step "[7/7] Building desktop application..."
    
    try {
        $rustOk = rustc --version 2>$null
        if (-not $?) {
            Write-ERR "Rust unavailable. Skipping desktop build."
            Write-ERR "Install Rust and run: npm run build:desktop"
        } else {
            # Build executable (without NSIS installer)
            npm run build:desktop 2>&1 | Out-File "$ProjectRoot\desktop_build_output.txt"
            if ($LASTEXITCODE -eq 0) {
                $exeDir = Join-Path $ProjectRoot "src-tauri\target\release"
                $exe = Get-ChildItem $exeDir -Filter "*.exe" | Select-Object -First 1
                Write-OK "Desktop build complete: $($exe.Name)"
                
                # Create NSIS installer if requested
                if ($CreateReleasePackage) {
                    Write-Step "Creating NSIS installer..."
                    npm run bundle:desktop 2>&1 | Out-File "$ProjectRoot\nsis_build_output.txt"
                    if ($LASTEXITCODE -eq 0) {
                        $installerDir = Join-Path $ProjectRoot "src-tauri\target\release\bundle\nsis"
                        $installer = Get-ChildItem $installerDir -Filter "*.exe" | Select-Object -First 1
                        Write-OK "Installer built: $($installer.Name) ($($installer.Length) bytes)"
                        Write-OK "SHA256: $((Get-FileHash $installer.FullName -Algorithm SHA256).Hash)"
                    } else {
                        Write-ERR "NSIS build failed!"
                    }
                }
            } else {
                Write-ERR "Desktop build failed!"
                Get-Content "$ProjectRoot\desktop_build_output.txt" -Tail 20
            }
        }
    } catch {
        Write-ERR "Desktop build error: $_"
    }
}

# Summary
Write-Step "=== BUILD SUMMARY ==="
Write-Step "Source: $ProjectRoot"
Write-Step "Version: 1.0.0"
if (Test-Path $resourceZip) {
    Write-OK "Resource ZIP: $((Get-Item $resourceZip).Length) bytes"
}
$distDir = Join-Path $ProjectRoot "dist"
if (Test-Path $distDir) {
    Write-OK "Web dist: ready"
}
$releaseDir = Join-Path $ProjectRoot "src-tauri\target\release"
if (Test-Path $releaseDir) {
    $exe = Get-ChildItem $releaseDir -Filter "*.exe" | Select-Object -First 1
    if ($exe) {
        Write-OK "Desktop executable: $($exe.FullName)"
    }
}
Write-Step "Build log saved to: $BuildLog"
Write-Host ""
Write-Host "Done! To build the complete installer, ensure Rust is installed and run:" -ForegroundColor Yellow
Write-Host "  .\scripts\full-build.ps1 -CreateReleasePackage" -ForegroundColor Yellow
