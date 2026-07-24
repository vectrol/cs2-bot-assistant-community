use tauri::AppHandle;

use crate::errors::AppError;
use crate::models::cs2::{
    AiApiConfig, BotTauntsConfig, CommandsTxtPayload, Cs2EnvironmentStatus, Cs2RootCandidate,
    DemoDiscoveryPayload, DiagnosticsPayload, DifficultyPreset, GameModePreset, NadeRecoveryConfig,
    OperationResult, PluginInfo,
};
use crate::services::cs2;

#[tauri::command]
pub fn discover_cs2_roots() -> Result<Vec<Cs2RootCandidate>, String> {
    cs2::discover_cs2_roots().map_err(AppError::into_string)
}

#[tauri::command]
pub fn inspect_cs2_root(root_path: String) -> Result<Cs2EnvironmentStatus, String> {
    cs2::inspect_cs2_root(&root_path).map_err(AppError::into_string)
}

#[tauri::command]
pub fn check_cs2_process() -> Result<bool, String> {
    cs2::check_cs2_process().map_err(AppError::into_string)
}

#[tauri::command]
pub fn install_bot_package(app: AppHandle, root_path: String) -> Result<OperationResult, String> {
    cs2::install_bot_package(&app, &root_path).map_err(AppError::into_string)
}

#[tauri::command]
pub fn apply_difficulty_profile(
    root_path: String,
    preset: DifficultyPreset,
) -> Result<OperationResult, String> {
    cs2::apply_difficulty_profile(&root_path, preset).map_err(AppError::into_string)
}

#[tauri::command]
pub fn set_upstream_aim_preset(
    root_path: String,
    value: String,
) -> Result<OperationResult, String> {
    cs2::set_upstream_aim_preset(&root_path, &value).map_err(AppError::into_string)
}

#[tauri::command]
pub fn set_upstream_nades_preset(
    root_path: String,
    value: String,
) -> Result<OperationResult, String> {
    cs2::set_upstream_nades_preset(&root_path, &value).map_err(AppError::into_string)
}

#[tauri::command]
pub fn set_game_mode_profile(
    root_path: String,
    preset: GameModePreset,
) -> Result<OperationResult, String> {
    cs2::set_game_mode_profile(&root_path, preset).map_err(AppError::into_string)
}

#[tauri::command]
pub fn get_ai_api_config(root_path: String) -> Result<AiApiConfig, String> {
    cs2::get_ai_api_config(&root_path).map_err(AppError::into_string)
}

#[tauri::command]
pub fn save_ai_api_config(
    root_path: String,
    config: AiApiConfig,
) -> Result<OperationResult, String> {
    cs2::save_ai_api_config(&root_path, config).map_err(AppError::into_string)
}

#[tauri::command]
pub fn reset_ai_api_config(root_path: String) -> Result<AiApiConfig, String> {
    cs2::reset_ai_api_config(&root_path).map_err(AppError::into_string)
}

#[tauri::command]
pub fn get_bot_taunts_config(root_path: String) -> Result<BotTauntsConfig, String> {
    cs2::get_bot_taunts_config(&root_path).map_err(AppError::into_string)
}

#[tauri::command]
pub fn save_bot_taunts_config(
    root_path: String,
    config: BotTauntsConfig,
) -> Result<OperationResult, String> {
    cs2::save_bot_taunts_config(&root_path, config).map_err(AppError::into_string)
}

#[tauri::command]
pub fn reset_bot_taunts_config(root_path: String) -> Result<BotTauntsConfig, String> {
    cs2::reset_bot_taunts_config(&root_path).map_err(AppError::into_string)
}

#[tauri::command]
pub fn get_nade_recovery_config(root_path: String) -> Result<NadeRecoveryConfig, String> {
    cs2::get_nade_recovery_config(&root_path).map_err(AppError::into_string)
}

#[tauri::command]
pub fn save_nade_recovery_config(
    root_path: String,
    config: NadeRecoveryConfig,
) -> Result<OperationResult, String> {
    cs2::save_nade_recovery_config(&root_path, config).map_err(AppError::into_string)
}

#[tauri::command]
pub fn reset_nade_recovery_config(root_path: String) -> Result<NadeRecoveryConfig, String> {
    cs2::reset_nade_recovery_config(&root_path).map_err(AppError::into_string)
}

#[tauri::command]
pub fn get_commands_txt(app: AppHandle) -> Result<CommandsTxtPayload, String> {
    cs2::get_commands_txt(&app).map_err(AppError::into_string)
}

#[tauri::command]
pub fn discover_demos(root_path: String) -> Result<DemoDiscoveryPayload, String> {
    cs2::discover_demos(&root_path).map_err(AppError::into_string)
}

#[tauri::command]
pub fn open_recent_demo_directory(root_path: String) -> Result<OperationResult, String> {
    cs2::open_recent_demo_directory(&root_path).map_err(AppError::into_string)
}

#[tauri::command]
pub fn open_demo_directory(
    root_path: String,
    directory_path: String,
) -> Result<OperationResult, String> {
    cs2::open_demo_directory(&root_path, &directory_path).map_err(AppError::into_string)
}

#[tauri::command]
pub fn open_diagnostics_log_directory() -> Result<OperationResult, String> {
    cs2::open_diagnostics_log_directory().map_err(AppError::into_string)
}

#[tauri::command]
pub fn uninstall_bot_package(root_path: String) -> Result<OperationResult, String> {
    cs2::uninstall_bot_package(&root_path).map_err(AppError::into_string)
}

#[tauri::command]
pub fn get_diagnostics_payload(root_path: Option<String>) -> Result<DiagnosticsPayload, String> {
    cs2::get_diagnostics_payload(root_path.as_deref()).map_err(AppError::into_string)
}

#[tauri::command]
pub fn list_plugins(root_path: String) -> Result<Vec<PluginInfo>, String> {
    cs2::list_plugins(&root_path).map_err(AppError::into_string)
}

#[tauri::command]
pub fn toggle_plugin(root_path: String, plugin_name: String) -> Result<PluginInfo, String> {
    cs2::toggle_plugin(&root_path, &plugin_name).map_err(AppError::into_string)
}

#[tauri::command]
pub fn list_match_history(root_path: String) -> Result<Vec<String>, String> {
    cs2::list_match_history_files(&root_path).map_err(AppError::into_string)
}

#[tauri::command]
pub fn read_match_history(root_path: String, filename: String) -> Result<String, String> {
    cs2::read_match_history_file(&root_path, &filename).map_err(AppError::into_string)
}
