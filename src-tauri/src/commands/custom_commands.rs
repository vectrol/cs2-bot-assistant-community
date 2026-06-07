use tauri::AppHandle;

use crate::errors::AppError;
use crate::models::custom_commands::{CustomCommandItem, CustomCommandsPayload};
use crate::services::custom_commands;

#[tauri::command]
pub fn load_custom_commands(app: AppHandle) -> Result<CustomCommandsPayload, String> {
    custom_commands::load_custom_commands(&app).map_err(AppError::into_string)
}

#[tauri::command]
pub fn save_custom_commands(
    app: AppHandle,
    items: Vec<CustomCommandItem>,
) -> Result<CustomCommandsPayload, String> {
    custom_commands::save_custom_commands(&app, items).map_err(AppError::into_string)
}
