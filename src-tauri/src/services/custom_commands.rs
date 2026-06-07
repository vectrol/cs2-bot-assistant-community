use std::fs;
use std::path::PathBuf;

use tauri::{AppHandle, Manager};

use crate::errors::AppError;
use crate::models::custom_commands::{CustomCommandItem, CustomCommandsPayload};

const CUSTOM_COMMANDS_FILE_NAME: &str = "custom-commands.json";

pub fn load_custom_commands(app: &AppHandle) -> Result<CustomCommandsPayload, AppError> {
    let storage_path = custom_commands_path(app)?;
    if !storage_path.exists() {
        return Ok(CustomCommandsPayload {
            items: Vec::new(),
            storage_path: storage_path.display().to_string(),
            exists: false,
        });
    }

    let content = fs::read_to_string(&storage_path).map_err(|error| {
        AppError::runtime(format!(
            "[CUSTOM_COMMANDS_READ_FAILED]\n读取“我的指令”失败：{}\n系统错误：{}",
            storage_path.display(),
            error
        ))
    })?;

    let items = serde_json::from_str::<Vec<CustomCommandItem>>(&content).map_err(|error| {
        AppError::runtime(format!(
            "[CUSTOM_COMMANDS_PARSE_FAILED]\n“我的指令”文件不是有效 JSON：{}\n解析错误：{}",
            storage_path.display(),
            error
        ))
    })?;

    Ok(CustomCommandsPayload {
        items,
        storage_path: storage_path.display().to_string(),
        exists: true,
    })
}

pub fn save_custom_commands(
    app: &AppHandle,
    items: Vec<CustomCommandItem>,
) -> Result<CustomCommandsPayload, AppError> {
    let storage_path = custom_commands_path(app)?;
    if let Some(parent) = storage_path.parent() {
        fs::create_dir_all(parent).map_err(|error| {
            AppError::runtime(format!(
                "[CUSTOM_COMMANDS_DIR_CREATE_FAILED]\n创建“我的指令”目录失败：{}\n系统错误：{}",
                parent.display(),
                error
            ))
        })?;
    }

    let content = serde_json::to_string_pretty(&items).map_err(|error| {
        AppError::runtime(format!(
            "[CUSTOM_COMMANDS_SERIALIZE_FAILED]\n序列化“我的指令”失败：{}",
            error
        ))
    })?;

    fs::write(&storage_path, format!("{content}\n")).map_err(|error| {
        AppError::runtime(format!(
            "[CUSTOM_COMMANDS_WRITE_FAILED]\n保存“我的指令”失败：{}\n系统错误：{}",
            storage_path.display(),
            error
        ))
    })?;

    Ok(CustomCommandsPayload {
        items,
        storage_path: storage_path.display().to_string(),
        exists: true,
    })
}

fn custom_commands_path(app: &AppHandle) -> Result<PathBuf, AppError> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|error| AppError::runtime(error.to_string()))?;
    Ok(app_data_dir.join(CUSTOM_COMMANDS_FILE_NAME))
}
