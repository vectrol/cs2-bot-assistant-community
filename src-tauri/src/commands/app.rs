use crate::errors::AppError;
use crate::models::runtime_context::RuntimeContext;
use crate::services::app_runtime;

#[tauri::command]
pub fn get_runtime_context() -> Result<RuntimeContext, String> {
    app_runtime::get_runtime_context().map_err(AppError::into_string)
}

#[tauri::command]
pub fn open_external_url(url: String) -> Result<(), String> {
    app_runtime::open_external_url(&url).map_err(AppError::into_string)
}

#[tauri::command]
pub fn launch_cs2_game() -> Result<(), String> {
    app_runtime::launch_cs2_game().map_err(AppError::into_string)
}

#[tauri::command]
pub fn launch_cs2_direct(cs2_root: String, insecure: bool, extra_args: Vec<String>) -> Result<(), String> {
    app_runtime::launch_cs2_direct(&cs2_root, insecure, extra_args).map_err(AppError::into_string)
}

#[tauri::command]
pub fn enable_autostart() -> Result<(), String> {
    app_runtime::enable_autostart().map_err(AppError::into_string)
}

#[tauri::command]
pub fn disable_autostart() -> Result<(), String> {
    app_runtime::disable_autostart().map_err(AppError::into_string)
}

#[tauri::command]
pub fn is_autostart_enabled() -> Result<bool, String> {
    app_runtime::is_autostart_enabled().map_err(AppError::into_string)
}

#[tauri::command]
pub fn open_inventory_window() -> Result<(), String> {
    app_runtime::open_inventory_window().map_err(AppError::into_string)
}
