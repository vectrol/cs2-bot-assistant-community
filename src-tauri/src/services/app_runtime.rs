use crate::errors::AppError;
use crate::models::runtime_context::RuntimeContext;

pub fn get_runtime_context() -> Result<RuntimeContext, AppError> {
    let app_name = option_env!("CARGO_PKG_DESCRIPTION")
        .filter(|value| !value.is_empty())
        .unwrap_or("CS2人机增强助手")
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

fn is_allowed_external_url(url: &str) -> bool {
    [
        "https://qm.qq.com/",
        "https://github.com/",
        "https://pan.quark.cn/",
    ]
    .iter()
    .any(|prefix| url.starts_with(prefix))
}
