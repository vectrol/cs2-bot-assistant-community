# CS2 Bot Improver Assistant - Resource Download & Repack Script
# This script downloads upstream releases and packages them into CS2BotImprover.zip
param(
    [string]$OutputDir = ".\src-tauri\resources",
    [switch]$SkipDownload
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"
$TempDir = Join-Path $env:TEMP "cs2-resource-build"
$LogFile = Join-Path $OutputDir "resource_build.log"

function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$timestamp $Message" | Tee-Object -FilePath $LogFile -Append
}

New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
New-Item -ItemType Directory -Path $TempDir -Force | Out-Null
"" | Out-File $LogFile
Write-Log "=== CS2 Bot Improver Resource Builder v1.0.0 ==="

# URLs for upstream releases
$ed0ardUrl = "https://github.com/ed0ard/CS2-Bot-Improver/releases/download/v1.4.2/CS2BotImprover.zip"
$plusPluginUrl = "https://github.com/numakkiyu/CS2-Bot-Improver-Plus/releases/download/v1.4.2.4/CS2BotImproverPlus-plugin-v1.4.2.4-windows.zip"

$ed0ardFile = Join-Path $TempDir "CS2BotImprover_ed0ard_v1.4.2.zip"
$plusFile = Join-Path $TempDir "CS2BotImproverPlus_plugin_v1.4.2.4.zip"

if (-not $SkipDownload) {
    # Download ed0ard CS2BotImprover.zip
    Write-Log "Downloading ed0ard CS2BotImprover v1.4.2..."
    if (-not (Test-Path $ed0ardFile) -or (Get-Item $ed0ardFile).Length -lt 50000000) {
        Write-Log "  URL: $ed0ardUrl"
        try {
            Invoke-WebRequest -Uri $ed0ardUrl -OutFile $ed0ardFile -UseBasicParsing -TimeoutSec 3600
            Write-Log "  Downloaded: $((Get-Item $ed0ardFile).Length) bytes"
            Write-Log "  SHA256: $((Get-FileHash $ed0ardFile -Algorithm SHA256).Hash)"
        } catch {
            Write-Log "  ERROR: $_"
            Write-Log "  Please download manually and place at: $ed0ardFile"
            Write-Log "  URL: $ed0ardUrl"
            exit 1
        }
    } else {
        Write-Log "  Already exists: $((Get-Item $ed0ardFile).Length) bytes"
    }

    # Download numakkiyu Plus plugin
    Write-Log "Downloading numakkiyu CS2BotImproverPlus plugin v1.4.2.4..."
    if (-not (Test-Path $plusFile) -or (Get-Item $plusFile).Length -lt 50000000) {
        Write-Log "  URL: $plusPluginUrl"
        try {
            Invoke-WebRequest -Uri $plusPluginUrl -OutFile $plusFile -UseBasicParsing -TimeoutSec 3600
            Write-Log "  Downloaded: $((Get-Item $plusFile).Length) bytes"
            Write-Log "  SHA256: $((Get-FileHash $plusFile -Algorithm SHA256).Hash)"
        } catch {
            Write-Log "  ERROR: $_"
            Write-Log "  Please download manually and place at: $plusFile"
            Write-Log "  URL: $plusPluginUrl"
            exit 1
        }
    } else {
        Write-Log "  Already exists: $((Get-Item $plusFile).Length) bytes"
    }
}

# Verify downloads
foreach ($f in @($ed0ardFile, $plusFile)) {
    if (-not (Test-Path $f)) {
        Write-Log "ERROR: Missing file: $f"
        exit 1
    }
}

# Extract and repackage
Write-Log "Building combined CS2BotImprover.zip..."
$BuildRoot = Join-Path $TempDir "build"
$CombinedStaging = Join-Path $TempDir "combined"
$OutputZip = Join-Path $OutputDir "CS2BotImprover.zip"

if (Test-Path $BuildRoot) { Remove-Item $BuildRoot -Recurse -Force }
if (Test-Path $CombinedStaging) { Remove-Item $CombinedStaging -Recurse -Force }
New-Item -ItemType Directory -Path $CombinedStaging -Force | Out-Null

# Extract ed0ard's base package
Write-Log "Extracting ed0ard base package..."
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::ExtractToDirectory($ed0ardFile, $BuildRoot)
Write-Log "  Base package entries:"

# Find the root directory that contains addons/
$payloadRoot = $BuildRoot
$addonsPath = Join-Path $BuildRoot "addons"
if (-not (Test-Path $addonsPath)) {
    $subDirs = Get-ChildItem $BuildRoot -Directory
    foreach ($sd in $subDirs) {
        if (Test-Path (Join-Path $sd.FullName "addons")) {
            $payloadRoot = $sd.FullName
            Write-Log "  Found payload root: $($sd.Name)"
            break
        }
    }
}

# Copy base files
Write-Log "Copying base files..."
Get-ChildItem $payloadRoot | ForEach-Object {
    $dest = Join-Path $CombinedStaging $_.Name
    Copy-Item $_.FullName -Destination $dest -Recurse -Force
    Write-Log "  + $($_.Name)"
}

# Extract Plus plugin and merge
Write-Log "Extracting Plus plugin..."
$PlusBuildRoot = Join-Path $BuildRoot "plus"
New-Item -ItemType Directory -Path $PlusBuildRoot -Force | Out-Null
[System.IO.Compression.ZipFile]::ExtractToDirectory($plusFile, $PlusBuildRoot)

# Find Plus payload root
$plusPayloadRoot = $PlusBuildRoot
$plusAddonsPath = Join-Path $PlusBuildRoot "addons"
if (-not (Test-Path $plusAddonsPath)) {
    $subDirs = Get-ChildItem $PlusBuildRoot -Directory
    foreach ($sd in $subDirs) {
        if (Test-Path (Join-Path $sd.FullName "addons")) {
            $plusPayloadRoot = $sd.FullName
            break
        }
    }
}

# Merge Plus files (overwrite existing)
Write-Log "Merging Plus plugin files..."
Get-ChildItem $plusPayloadRoot | ForEach-Object {
    $dest = Join-Path $CombinedStaging $_.Name
    if (Test-Path $dest) {
        Write-Log "  ~ $($_.Name) (overwriting)"
        Remove-Item $dest -Recurse -Force -ErrorAction SilentlyContinue
    } else {
        Write-Log "  + $($_.Name) (new)"
    }
    Copy-Item $_.FullName -Destination $dest -Recurse -Force
}

# Add version marker
$versionMarker = @"
# CS2 Bot Improver Combined Package
# Built: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
# Sources:
#   - ed0ard/CS2-Bot-Improver v1.4.2
#   - numakkiyu/CS2-Bot-Improver-Plus v1.4.2.4
# Build SHA256 of ed0ard base: $((Get-FileHash $ed0ardFile -Algorithm SHA256).Hash)
# Build SHA256 of Plus plugin: $((Get-FileHash $plusFile -Algorithm SHA256).Hash)
"@
$versionMarker | Out-File (Join-Path $CombinedStaging "BUILD_INFO.txt") -Encoding UTF8

# Create the final ZIP
Write-Log "Creating CS2BotImprover.zip..."
if (Test-Path $OutputZip) { Remove-Item $OutputZip -Force }

Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($CombinedStaging, $OutputZip,
    [System.IO.Compression.CompressionLevel]::Optimal, $false)

$outputSize = (Get-Item $OutputZip).Length
$outputHash = (Get-FileHash $OutputZip -Algorithm SHA256).Hash
Write-Log "=== BUILD COMPLETE ==="
Write-Log "Output: $OutputZip"
Write-Log "Size:   $outputSize bytes ($([math]::Round($outputSize / 1MB, 2)) MB)"
Write-Log "SHA256: $outputHash"

# Cleanup
Remove-Item $BuildRoot -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item $CombinedStaging -Recurse -Force -ErrorAction SilentlyContinue

Write-Log "Build log saved to: $LogFile"
Write-Host "`n=== BUILD SUCCESS ==="
Write-Host "Output: $OutputZip"
Write-Host "Size:   $outputSize bytes"
Write-Host "SHA256: $outputHash"
