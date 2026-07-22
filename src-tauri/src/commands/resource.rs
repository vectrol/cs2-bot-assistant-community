use crate::errors::AppError;
use crate::models::cs2::{BackupEntry, OperationResult, ResourcePackInfo};
use crate::services::resource;

#[tauri::command]
pub fn get_resource_pack_info() -> Result<ResourcePackInfo, String> {
    resource::get_resource_pack_info().map_err(AppError::into_string)
}

#[tauri::command]
pub fn create_backup(root_path: String, label: String) -> Result<BackupEntry, String> {
    resource::create_backup(&root_path, &label).map_err(AppError::into_string)
}

#[tauri::command]
pub fn list_backups() -> Result<Vec<BackupEntry>, String> {
    resource::list_backups().map_err(AppError::into_string)
}

#[tauri::command]
pub fn restore_backup(backup_id: String, root_path: String) -> Result<OperationResult, String> {
    resource::restore_backup(&backup_id, &root_path).map_err(AppError::into_string)
}
