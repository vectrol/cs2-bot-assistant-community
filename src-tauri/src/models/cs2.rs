
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Cs2RootCandidate {
    pub path: String,
    pub source: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Cs2EnvironmentStatus {
    pub root_path: String,
    pub game_dir_exists: bool,
    pub csgo_dir_exists: bool,
    pub metamod_exists: bool,
    pub counterstrike_sharp_exists: bool,
    pub gameinfo_exists: bool,
    pub active_botprofile_exists: bool,
    pub backup_online_gameinfo_exists: bool,
    pub backup_withbots_gameinfo_exists: bool,
    pub low_profile_exists: bool,
    pub medium_profile_exists: bool,
    pub high_profile_exists: bool,
    pub bot_hider_exists: bool,
    pub ray_trace_exists: bool,
    pub core_config_exists: bool,
    pub bot_hider_impl_exists: bool,
    pub ray_trace_impl_exists: bool,
    pub round_damage_recap_exists: bool,
    pub inventory_simulator_exists: bool,
    pub active_game_mode: String,
    pub base_environment_ready: bool,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OperationResult {
    pub success: bool,
    pub message: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DemoDirectoryCandidate {
    pub path: String,
    pub source: String,
    pub exists: bool,
    pub demo_count: usize,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RecentDemoFile {
    pub file_name: String,
    pub path: String,
    pub directory_path: String,
    pub modified_at: String,
    pub modified_timestamp: i64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DemoDiscoveryPayload {
    pub candidates: Vec<DemoDirectoryCandidate>,
    pub recent_demo: Option<RecentDemoFile>,
    pub default_directory: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct InstallDiagnostics {
    pub zip_path: String,
    pub temp_dir: String,
    pub destination_dir: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DiagnosticsPayload {
    pub summary: String,
    pub full_log: String,
    pub log_path: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CommandsTxtPayload {
    pub content: String,
    pub source_path: String,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AiApiConfig {
    pub ai_api_url: String,
    pub ai_api_key: String,
    pub bot_rivalry_enabled: bool,
    pub config_path: String,
    pub exists: bool,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NadeRecoveryConfig {
    pub flash: f64,
    pub smoke: f64,
    pub he: f64,
    pub molotov: f64,
    pub incgrenade: f64,
    pub decoy: f64,
    pub config_path: String,
    pub exists: bool,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BotTauntsConfig {
    pub normal_taunts: Vec<String>,
    pub headshot_taunts: Vec<String>,
    pub knife_taunts: Vec<String>,
    pub bot_rivalry_taunts: Vec<String>,
    pub opening_trash_talks: Vec<String>,
    pub round_kill_taunt: String,
    pub multi_kill_taunt: String,
    pub clutch_taunt: String,
    pub save_taunt: String,
    pub config_path: String,
    pub exists: bool,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum DifficultyPreset {
    Low,
    Medium,
    High,
}

impl DifficultyPreset {
    pub fn as_folder_name(&self) -> &'static str {
        match self {
            Self::Low => "Low",
            Self::Medium => "Medium",
            Self::High => "High",
        }
    }
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum GameModePreset {
    Online,
    WithBots,
}

impl GameModePreset {
    pub fn as_folder_name(&self) -> &'static str {
        match self {
            Self::Online => "Online",
            Self::WithBots => "WithBots",
        }
    }
}
