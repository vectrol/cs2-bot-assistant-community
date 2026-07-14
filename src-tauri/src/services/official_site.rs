use crate::errors::AppError;
use crate::services::app_runtime;
use tauri::{
    webview::{NewWindowResponse, PageLoadEvent, WebviewBuilder},
    Emitter, LogicalPosition, LogicalSize, Manager, Rect, Url, WebviewUrl,
};

const MAIN_WINDOW_LABEL: &str = "main";
const OFFICIAL_SITE_WEBVIEW_LABEL: &str = "official-site-webview";
const OFFICIAL_SITE_ORIGIN: &str = "https://cs2as.600318.xyz";
const OFFICIAL_SITE_IDEA_URL: &str = "https://cs2as.600318.xyz/idea";
const PRINT_GUARD_SCRIPT: &str = r#"
(() => {
  const stopPrint = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (typeof event.stopImmediatePropagation === 'function') {
      event.stopImmediatePropagation();
    }
  };

  window.addEventListener('contextmenu', stopPrint, true);
  window.addEventListener('keydown', (event) => {
    const key = String(event.key || '').toLowerCase();
    if ((event.ctrlKey || event.metaKey) && key === 'p') {
      stopPrint(event);
    }
  }, true);
  window.print = () => {};
})();
"#;

#[derive(Clone, serde::Serialize)]
struct OfficialSiteNavigationEvent {
    url: String,
    reason: String,
}

#[derive(Clone, serde::Serialize)]
struct OfficialSiteLoadEvent {
    url: String,
    state: &'static str,
}

#[derive(Clone, serde::Serialize)]
struct OfficialSiteExternalOpenEvent {
    url: String,
    host: String,
}

pub async fn show(
    app: &tauri::AppHandle,
    raw_url: &str,
    x: f64,
    y: f64,
    width: f64,
    height: f64,
) -> Result<String, AppError> {
    let url = normalize_official_url(raw_url)?;
    let bounds = logical_rect(x, y, width, height);

    if let Some(webview) = app.get_webview(OFFICIAL_SITE_WEBVIEW_LABEL) {
        webview
            .set_bounds(bounds)
            .map_err(|error| AppError::runtime(format!("调整官网页面区域失败：{}", error)))?;
        webview
            .show()
            .map_err(|error| AppError::runtime(format!("显示官网页面失败：{}", error)))?;
        webview
            .navigate(url.clone())
            .map_err(|error| AppError::runtime(format!("打开官网页面失败：{}", error)))?;
        return Ok(url.to_string());
    }

    let window = app
        .get_window(MAIN_WINDOW_LABEL)
        .ok_or_else(|| AppError::runtime("主窗口未就绪，无法打开官网页面。"))?;
    let app_for_navigation = app.clone();
    let app_for_new_window = app.clone();
    let app_for_page_load = app.clone();

    let webview_builder = WebviewBuilder::new(
        OFFICIAL_SITE_WEBVIEW_LABEL,
        WebviewUrl::External(url.clone()),
    )
    .initialization_script_for_all_frames(PRINT_GUARD_SCRIPT)
    .on_navigation(move |target_url| {
        handle_navigation_target(&app_for_navigation, target_url)
    })
    .on_new_window(move |target_url, _features| {
        if is_allowed_official_url(&target_url) {
            if let Some(webview) = app_for_new_window.get_webview(OFFICIAL_SITE_WEBVIEW_LABEL) {
                let _ = webview.navigate(target_url);
            }
        } else {
            handle_navigation_target(&app_for_new_window, &target_url);
        }
        NewWindowResponse::Deny
    })
    .on_page_load(move |_webview, payload| {
        let state = match payload.event() {
            PageLoadEvent::Started => "started",
            PageLoadEvent::Finished => "finished",
        };
        let _ = app_for_page_load.emit(
            "official-site:load-state",
            OfficialSiteLoadEvent {
                url: payload.url().to_string(),
                state,
            },
        );
    });

    let webview = window
        .add_child(
            webview_builder,
            LogicalPosition::new(x, y),
            LogicalSize::new(width.max(1.0), height.max(1.0)),
        )
        .map_err(|error| AppError::runtime(format!("创建官网页面失败：{}", error)))?;
    webview
        .set_bounds(bounds)
        .map_err(|error| AppError::runtime(format!("调整官网页面区域失败：{}", error)))?;
    webview
        .show()
        .map_err(|error| AppError::runtime(format!("显示官网页面失败：{}", error)))?;

    Ok(url.to_string())
}

pub fn navigate(app: &tauri::AppHandle, raw_url: &str) -> Result<String, AppError> {
    let url = normalize_official_url(raw_url)?;
    let webview = get_official_webview(app)?;
    webview
        .navigate(url.clone())
        .map_err(|error| AppError::runtime(format!("打开官网页面失败：{}", error)))?;
    Ok(url.to_string())
}

pub fn set_bounds(
    app: &tauri::AppHandle,
    x: f64,
    y: f64,
    width: f64,
    height: f64,
) -> Result<(), AppError> {
    if let Some(webview) = app.get_webview(OFFICIAL_SITE_WEBVIEW_LABEL) {
        webview
            .set_bounds(logical_rect(x, y, width, height))
            .map_err(|error| AppError::runtime(format!("调整官网页面区域失败：{}", error)))?;
    }
    Ok(())
}

pub fn hide(app: &tauri::AppHandle) -> Result<(), AppError> {
    if let Some(webview) = app.get_webview(OFFICIAL_SITE_WEBVIEW_LABEL) {
        webview
            .hide()
            .map_err(|error| AppError::runtime(format!("隐藏官网页面失败：{}", error)))?;
    }
    Ok(())
}

pub fn reload(app: &tauri::AppHandle) -> Result<(), AppError> {
    let webview = get_official_webview(app)?;
    webview
        .reload()
        .map_err(|error| AppError::runtime(format!("刷新官网页面失败：{}", error)))
}

pub fn go_back(app: &tauri::AppHandle) -> Result<(), AppError> {
    let webview = get_official_webview(app)?;
    webview
        .eval("history.back()")
        .map_err(|error| AppError::runtime(format!("官网页面后退失败：{}", error)))
}

pub fn go_forward(app: &tauri::AppHandle) -> Result<(), AppError> {
    let webview = get_official_webview(app)?;
    webview
        .eval("history.forward()")
        .map_err(|error| AppError::runtime(format!("官网页面前进失败：{}", error)))
}

fn get_official_webview(app: &tauri::AppHandle) -> Result<tauri::Webview, AppError> {
    app.get_webview(OFFICIAL_SITE_WEBVIEW_LABEL)
        .ok_or_else(|| AppError::runtime("官网页面尚未打开。"))
}

fn normalize_official_url(raw_url: &str) -> Result<Url, AppError> {
    let value = raw_url.trim();
    let normalized = if value.is_empty() {
        OFFICIAL_SITE_IDEA_URL.to_string()
    } else if value.starts_with('/') {
        format!("{OFFICIAL_SITE_ORIGIN}{value}")
    } else if value == "cs2as.600318.xyz" {
        format!("{OFFICIAL_SITE_ORIGIN}/")
    } else if value.starts_with("cs2as.600318.xyz/") {
        format!("https://{value}")
    } else {
        value.to_string()
    };

    let url = Url::parse(&normalized)
        .map_err(|_| AppError::runtime("请输入 CS2AS 官网地址，或站内路径如 /idea。"))?;
    if !is_allowed_official_url(&url) {
        return Err(AppError::runtime("只能访问 CS2AS 官网内的页面。"));
    }
    Ok(url)
}

fn is_allowed_official_url(url: &Url) -> bool {
    if url.scheme() != "https" || url.host_str() != Some("cs2as.600318.xyz") {
        return false;
    }

    matches!(url.path(), "/" | "/idea" | "/rizhi" | "/commands")
        || is_allowed_command_detail_path(url.path())
}

fn is_allowed_command_detail_path(path: &str) -> bool {
    let Some(slug) = path.strip_prefix("/commands/") else {
        return false;
    };
    !slug.is_empty()
        && slug.len() <= 80
        && !slug.starts_with('-')
        && !slug.ends_with('-')
        && slug
            .bytes()
            .all(|value| value.is_ascii_lowercase() || value.is_ascii_digit() || value == b'-')
}

fn is_allowed_external_url(url: &Url) -> bool {
    url.scheme() == "https"
        && matches!(
            url.host_str(),
            Some("pan.quark.cn") | Some("qm.qq.com") | Some("github.com")
        )
}

fn handle_navigation_target(app: &tauri::AppHandle, target_url: &Url) -> bool {
    if is_allowed_official_url(target_url) {
        return true;
    }

    if is_allowed_external_url(target_url) {
        match app_runtime::open_external_url(target_url.as_str()) {
            Ok(()) => emit_external_opened(app, target_url),
            Err(error) => emit_navigation_blocked(app, target_url, &error.into_string()),
        }
        return false;
    }

    emit_navigation_blocked(
        app,
        target_url,
        "已阻止非官网链接。下载、QQ群和 GitHub 链接会用系统浏览器打开。",
    );
    false
}

fn logical_rect(x: f64, y: f64, width: f64, height: f64) -> Rect {
    Rect {
        position: tauri::Position::Logical(LogicalPosition::new(x, y)),
        size: tauri::Size::Logical(LogicalSize::new(width.max(1.0), height.max(1.0))),
    }
}

fn emit_navigation_blocked(app: &tauri::AppHandle, url: &Url, reason: &str) {
    let _ = app.emit(
        "official-site:navigation-blocked",
        OfficialSiteNavigationEvent {
            url: url.to_string(),
            reason: reason.to_string(),
        },
    );
}

fn emit_external_opened(app: &tauri::AppHandle, url: &Url) {
    let host = url.host_str().unwrap_or("外部链接").to_string();
    let _ = app.emit(
        "official-site:external-opened",
        OfficialSiteExternalOpenEvent {
            url: url.to_string(),
            host,
        },
    );
}
