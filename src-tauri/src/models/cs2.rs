use std::collections::BTreeMap;

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

#[derive(Debug, Clone, Deserialize, Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct KnifePreset {
    pub paint: i32,
    pub seed: i32,
    pub wear: f64,
    pub name_tag: String,
    pub stattrak_enabled: bool,
    pub stattrak_count: i32,
    pub souvenir_enabled: bool,
}

#[derive(Debug, Clone, Deserialize, Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct GlovePreset {
    pub enabled: bool,
    pub defindex: i32,
    pub paint: i32,
    pub seed: i32,
    pub wear: f64,
}

#[derive(Debug, Clone, Deserialize, Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct PlayerCosmeticsPatch {
    #[serde(default)]
    pub enabled: bool,
    #[serde(default)]
    pub apply_to_human_players: bool,
    #[serde(default)]
    pub apply_on_pickup: bool,
    #[serde(default)]
    pub default_knife_defindex: i32,
    #[serde(default)]
    pub presets: BTreeMap<String, KnifePreset>,
    #[serde(default)]
    pub gun_presets: BTreeMap<String, KnifePreset>,
    #[serde(default)]
    pub music_kit_id: i32,
    #[serde(default)]
    pub glove: GlovePreset,
}

#[derive(Debug, Clone, Deserialize, Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct PlayerCosmeticsState {
    #[serde(flatten)]
    pub patch: PlayerCosmeticsPatch,
    pub config_path: String,
    pub plugin_present: bool,
    pub exists: bool,
    pub cs2_running: bool,
}

#[derive(Debug, Clone, Deserialize, Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct DropKnivesState {
    pub bind_key: String,
    pub selected: Vec<u16>,
    pub cfg_present: bool,
    pub cs2_running: bool,
}

#[derive(Debug, Clone, Deserialize, Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct BotItemsState {
    pub skins: bool,
    pub profiles: bool,
    pub agents: bool,
    pub music: bool,
    pub cfg_present: bool,
    pub cs2_running: bool,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PlusRuntimeStatus {
    pub directory_selected: bool,
    pub resources_ready: bool,
    pub cs2_running: bool,
    pub mode: String,
    pub restart_required: bool,
    pub player_knife_customizer_present: bool,
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
