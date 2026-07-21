use crate::errors::AppError;
use crate::models::runtime_context::RuntimeContext;

#[cfg(target_os = "windows")]
const AUTOSTART_REG_KEY: &str = r"Software\Microsoft\Windows\CurrentVersion\Run";
#[cfg(target_os = "windows")]
const AUTOSTART_VALUE_NAME: &str = "CS2BotAssistantCE";
#[cfg(target_os = "windows")]
const LEGACY_AUTOSTART_VALUE_NAME: &str = "CS2人机增强助手";

pub fn get_runtime_context() -> Result<RuntimeContext, AppError> {
    let app_name = option_env!("CARGO_PKG_DESCRIPTION")
        .filter(|value| !value.is_empty())
        .unwrap_or("CS2人机助手社区版")
        .to_string();

    if app_name.trim().is_empty() {
        return Err(AppError::runtime("应用名称为空"));
    }

    Ok(RuntimeContext {
        app_name,
        app_version: env!("CARGO_PKG_VERSION").to_string(),
        rust_crate: env!("CARGO_PKG_NAME").to_string(),
        target: std::env::consts::ARCH.to_string(),
        profile: option_env!("PROFILE").unwrap_or("dev").to_string(),
    })
}

pub fn open_external_url(url: &str) -> Result<(), AppError> {
    let trimmed = url.trim();
    if !is_allowed_external_url(trimmed) {
        return Err(AppError::runtime("不允许打开此链接。"));
    }

    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("rundll32.exe")
            .args(["url.dll,FileProtocolHandler", trimmed])
            .spawn()
            .map_err(|error| AppError::runtime(format!("打开链接失败：{}", error)))?;
    }

    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(trimmed)
            .spawn()
            .map_err(|error| AppError::runtime(format!("打开链接失败：{}", error)))?;
    }

    #[cfg(all(unix, not(target_os = "macos")))]
    {
        std::process::Command::new("xdg-open")
            .arg(trimmed)
            .spawn()
            .map_err(|error| AppError::runtime(format!("打开链接失败：{}", error)))?;
    }

    Ok(())
}

pub fn launch_cs2_game() -> Result<(), AppError> {
    open_fixed_protocol_url("steam://rungameid/730")
        .map_err(|error| AppError::runtime(format!("打开 CS2 失败：{}", error)))
}

pub fn launch_cs2_direct(cs2_root: &str, insecure: bool) -> Result<(), AppError> {
    let root = std::path::Path::new(cs2_root);
    let exe_path = root
        .join("game")
        .join("bin")
        .join("win64")
        .join("cs2.exe");

    if !exe_path.is_file() {
        return Err(AppError::runtime(format!(
            "未找到 CS2 可执行文件：{}",
            exe_path.display()
        )));
    }

    let mut cmd = std::process::Command::new(exe_path);
    if insecure {
        cmd.arg("-insecure");
    }

    cmd.spawn()
        .map(|_| ())
        .map_err(|error| AppError::runtime(format!("启动 CS2 失败：{}", error)))
}

pub fn open_inventory_window() -> Result<(), AppError> {
    open_fixed_protocol_url("https://inventory.cstrike.app")
        .map_err(|error| AppError::runtime(format!("打开库存模拟器失败：{}", error)))
}

pub fn enable_autostart() -> Result<(), AppError> {
    #[cfg(target_os = "windows")]
    {
        let command = format!("\"{}\" --autostart", current_exe_path()?.display());
        let key = autostart_reg_key()?;
        key.set_value(AUTOSTART_VALUE_NAME, &command)
            .map_err(|error| AppError::runtime(format!("开启开机自启动失败：{}", error)))?;
        let _ = key.delete_value(LEGACY_AUTOSTART_VALUE_NAME);

        Ok(())
    }

    #[cfg(not(target_os = "windows"))]
    {
        Err(AppError::runtime("当前平台暂不支持开机自启动设置。"))
    }
}

pub fn disable_autostart() -> Result<(), AppError> {
    #[cfg(target_os = "windows")]
    {
        let key = autostart_reg_key()?;
        let _ = key.delete_value(AUTOSTART_VALUE_NAME);
        let _ = key.delete_value(LEGACY_AUTOSTART_VALUE_NAME);

        Ok(())
    }

    #[cfg(not(target_os = "windows"))]
    {
        Err(AppError::runtime("当前平台暂不支持开机自启动设置。"))
    }
}

pub fn is_autostart_enabled() -> Result<bool, AppError> {
    #[cfg(target_os = "windows")]
    {
        let key = open_autostart_reg_key()?;
        let value = match key.get_value::<String, _>(AUTOSTART_VALUE_NAME) {
            Ok(value) => value,
            Err(_) => return Ok(false),
        };
        let Some(exe_path) = extract_autostart_exe_path(&value) else {
            return Ok(false);
        };

        Ok(paths_match(&exe_path, &current_exe_path()?))
    }

    #[cfg(not(target_os = "windows"))]
    {
        Ok(false)
    }
}

fn open_fixed_protocol_url(url: &str) -> Result<(), std::io::Error> {
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("rundll32.exe")
            .args(["url.dll,FileProtocolHandler", url])
            .spawn()
            .map(|_| ())
    }

    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(url)
            .spawn()
            .map(|_| ())
    }

    #[cfg(all(unix, not(target_os = "macos")))]
    {
        std::process::Command::new("xdg-open")
            .arg(url)
            .spawn()
            .map(|_| ())
    }
}

#[cfg(target_os = "windows")]
fn current_exe_path() -> Result<std::path::PathBuf, AppError> {
    std::env::current_exe()
        .map_err(|error| AppError::runtime(format!("读取程序路径失败：{}", error)))
}

#[cfg(target_os = "windows")]
fn autostart_reg_key() -> Result<winreg::RegKey, AppError> {
    use winreg::enums::HKEY_CURRENT_USER;
    use winreg::RegKey;

    RegKey::predef(HKEY_CURRENT_USER)
        .create_subkey(AUTOSTART_REG_KEY)
        .map(|(key, _)| key)
        .map_err(|error| AppError::runtime(format!("打开开机自启动注册表失败：{}", error)))
}

#[cfg(target_os = "windows")]
fn open_autostart_reg_key() -> Result<winreg::RegKey, AppError> {
    use winreg::enums::{HKEY_CURRENT_USER, KEY_READ};
    use winreg::RegKey;

    RegKey::predef(HKEY_CURRENT_USER)
        .open_subkey_with_flags(AUTOSTART_REG_KEY, KEY_READ)
        .map_err(|error| AppError::runtime(format!("读取开机自启动注册表失败：{}", error)))
}

#[cfg(target_os = "windows")]
fn extract_autostart_exe_path(value: &str) -> Option<std::path::PathBuf> {
    let trimmed = value.trim();
    if trimmed.is_empty() {
        return None;
    }

    let path = if let Some(rest) = trimmed.strip_prefix('"') {
        rest.split_once('"').map(|(path, _)| path)?
    } else {
        trimmed.split_whitespace().next()?
    };

    Some(std::path::PathBuf::from(path))
}

#[cfg(target_os = "windows")]
fn paths_match(actual: &std::path::Path, expected: &std::path::Path) -> bool {
    let normalize = |path: &std::path::Path| {
        path.canonicalize()
            .unwrap_or_else(|_| path.to_path_buf())
            .to_string_lossy()
            .replace('/', "\\")
            .to_lowercase()
    };

    normalize(actual) == normalize(expected)
}

fn is_allowed_external_url(url: &str) -> bool {
    [
        "https://github.com/",
        "https://inventory.cstrike.app/",
    ]
    .iter()
    .any(|prefix| url.starts_with(prefix))
}
