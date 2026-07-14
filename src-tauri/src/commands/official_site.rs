use crate::errors::AppError;
use crate::services::official_site;

#[tauri::command]
pub async fn official_site_show(
    app: tauri::AppHandle,
    url: String,
    x: f64,
    y: f64,
    width: f64,
    height: f64,
) -> Result<String, String> {
    official_site::show(&app, &url, x, y, width, height)
        .await
        .map_err(AppError::into_string)
}

#[tauri::command]
pub fn official_site_navigate(app: tauri::AppHandle, url: String) -> Result<String, String> {
    official_site::navigate(&app, &url).map_err(AppError::into_string)
}

#[tauri::command]
pub fn official_site_set_bounds(
    app: tauri::AppHandle,
    x: f64,
    y: f64,
    width: f64,
    height: f64,
) -> Result<(), String> {
    official_site::set_bounds(&app, x, y, width, height).map_err(AppError::into_string)
}

#[tauri::command]
pub fn official_site_hide(app: tauri::AppHandle) -> Result<(), String> {
    official_site::hide(&app).map_err(AppError::into_string)
}

#[tauri::command]
pub fn official_site_reload(app: tauri::AppHandle) -> Result<(), String> {
    official_site::reload(&app).map_err(AppError::into_string)
}

#[tauri::command]
pub fn official_site_go_back(app: tauri::AppHandle) -> Result<(), String> {
    official_site::go_back(&app).map_err(AppError::into_string)
}

#[tauri::command]
pub fn official_site_go_forward(app: tauri::AppHandle) -> Result<(), String> {
    official_site::go_forward(&app).map_err(AppError::into_string)
}
