use std::collections::{BTreeSet, HashMap};
use std::fs::{self, File, OpenOptions};
use std::io::{self, Write};
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

use chrono::{DateTime, Local};
use sysinfo::System;
use tauri::{AppHandle, Manager};
use zip::ZipArchive;

use crate::errors::AppError;
use crate::models::cs2::{
    AiApiConfig, BotTauntsConfig, CommandsTxtPayload, Cs2EnvironmentStatus, Cs2RootCandidate,
    DemoDirectoryCandidate, DemoDiscoveryPayload, DiagnosticsPayload, DifficultyPreset,
    GameModePreset, InstallDiagnostics, NadeRecoveryConfig,
    OperationResult, PluginInfo, RecentDemoFile,
};

const CS2_FOLDER_NAME: &str = "Counter-Strike Global Offensive";
const DEFAULT_APP_NAME: &str = "CS2人机助手社区版";
const DEFAULT_BUNDLED_ZIP_NAME: &str = "CS2BotImprover.zip";
const DEFAULT_FALLBACK_ZIP_PATH: &str = "";
const DEFAULT_INSTALL_TEMP_PREFIX: &str = "cs2-bot-improver-install";
const DEFAULT_LOG_DIR_NAME: &str = "CS2人机助手社区版";
const GAMEINFO_FILE_NAME: &str = "gameinfo.gi";
const COMMANDS_TXT_FILE_NAME: &str = "Commands.txt";
const BOT_TAUNT_CONFIG_RELATIVE_PATH: &[&str] = &[
    "game",
    "csgo",
    "addons",
    "counterstrikesharp",
    "configs",
    "plugins",
    "BotTaunt",
    "BotTaunt.json",
];
const BOT_TAUNTS_CONFIG_RELATIVE_PATH: &[&str] = &[
    "game",
    "csgo",
    "addons",
    "counterstrikesharp",
    "configs",
    "plugins",
    "BotTaunt",
    "Taunts.json",
];
const NADE_SYSTEM_CONFIG_RELATIVE_PATH: &[&str] = &[
    "game",
    "csgo",
    "addons",
    "counterstrikesharp",
    "configs",
    "plugins",
    "NadeSystem",
    "NadeSystem.json",
];
const INSTALL_TOP_LEVEL_DIRS: &[&str] = &["addons", "backup", "cfg", "overrides"];
const PLUGIN_PACKAGE_DIRS: &[&[&str]] = &[&["addons"], &["plugins"], &["cfg", "plugins"]];
const PLUGIN_PACKAGE_FILES: &[&[&str]] = &[&["metamod.vdf"], &["metamod_x64.vdf"]];
const LEGACY_PANEL_FILES: &[&str] = &["Panel v1.4.2.exe", "Panel v1.4.1.exe", "Panel v1.3.x.exe"];

fn app_name() -> &'static str {
    option_env!("CS2_APP_NAME").unwrap_or(DEFAULT_APP_NAME)
}

fn bundled_zip_name() -> &'static str {
    option_env!("CS2_BUNDLED_ZIP_NAME").unwrap_or(DEFAULT_BUNDLED_ZIP_NAME)
}

fn fallback_zip_path() -> &'static str {
    option_env!("CS2_FALLBACK_ZIP_PATH").unwrap_or(DEFAULT_FALLBACK_ZIP_PATH)
}

fn install_temp_prefix() -> &'static str {
    option_env!("CS2_INSTALL_TEMP_PREFIX").unwrap_or(DEFAULT_INSTALL_TEMP_PREFIX)
}

fn log_dir_name() -> &'static str {
    option_env!("CS2_LOG_DIR_NAME").unwrap_or(DEFAULT_LOG_DIR_NAME)
}

pub fn discover_cs2_roots() -> Result<Vec<Cs2RootCandidate>, AppError> {
    write_log("INFO", "正在扫描 CS2 候选目录。");
    let mut seen = BTreeSet::new();
    let mut candidates = Vec::new();

    for drive in existing_drives() {
        for steam_root in steam_roots_for_drive(&drive) {
            let common_path = steam_root
                .join("steamapps")
                .join("common")
                .join(CS2_FOLDER_NAME);
            add_candidate_path(&mut seen, &mut candidates, common_path, "Steam 常规目录");
            add_candidate_path(
                &mut seen,
                &mut candidates,
                steam_root.clone(),
                "Steam 根目录",
            );

            let libraries_file = steam_root.join("steamapps").join("libraryfolders.vdf");
            if libraries_file.exists() {
                for library_path in parse_libraryfolders_file(&libraries_file)? {
                    add_candidate_path(
                        &mut seen,
                        &mut candidates,
                        library_path.clone(),
                        "Steam 库根目录",
                    );
                    let cs2_path = library_path
                        .join("steamapps")
                        .join("common")
                        .join(CS2_FOLDER_NAME);
                    add_candidate_path(&mut seen, &mut candidates, cs2_path, "Steam 库配置");
                }
            }
        }

        for path in discover_drive_level_libraries(&drive)? {
            add_candidate_path(
                &mut seen,
                &mut candidates,
                path.join("steamapps").join("common").join(CS2_FOLDER_NAME),
                "磁盘扫描",
            );
        }
    }

    write_log(
        "INFO",
        &format!("找到 {} 个 CS2 候选目录。", candidates.len()),
    );
    Ok(candidates)
}

fn read_plugin_version(plugins_dir: &Path, plugin_name: &str) -> String {
    let deps_path = plugins_dir
        .join(plugin_name)
        .join(format!("{plugin_name}.deps.json"));
    let content = match fs::read_to_string(&deps_path) {
        Ok(c) => c,
        Err(_) => return String::new(),
    };
    let json: serde_json::Value = match serde_json::from_str(&content) {
        Ok(v) => v,
        Err(_) => return String::new(),
    };
    let Some(libraries) = json.get("libraries").and_then(|v| v.as_object()) else {
        return String::new();
    };
    let prefix = format!("{plugin_name}/");
    for key in libraries.keys() {
        if let Some(version) = key.strip_prefix(&prefix) {
            return version.to_string();
        }
    }
    String::new()
}

pub fn inspect_cs2_root(root_path: &str) -> Result<Cs2EnvironmentStatus, AppError> {
    let root = normalize_root(root_path)?;
    let game_dir = root.join("game");
    let csgo_dir = game_dir.join("csgo");

    let metamod = csgo_dir.join("addons").join("metamod");
    let counterstrike_sharp = csgo_dir.join("addons").join("counterstrikesharp");
    let gameinfo = csgo_dir.join(GAMEINFO_FILE_NAME);
    let active_botprofile = csgo_dir.join("overrides").join("botprofile.vpk");
    let backup_online_gameinfo = csgo_dir
        .join("backup")
        .join("Online")
        .join(GAMEINFO_FILE_NAME);
    let backup_withbots_gameinfo = csgo_dir
        .join("backup")
        .join("WithBots")
        .join(GAMEINFO_FILE_NAME);
    let low_profile = csgo_dir
        .join("overrides")
        .join("Low")
        .join("botprofile.vpk");
    let medium_profile = csgo_dir
        .join("overrides")
        .join("Medium")
        .join("botprofile.vpk");
    let high_profile = csgo_dir
        .join("overrides")
        .join("High")
        .join("botprofile.vpk");
    let bot_hider = csgo_dir.join("addons").join("BotHider");
    let ray_trace = csgo_dir.join("addons").join("RayTrace");
    let core_config = csgo_dir
        .join("addons")
        .join("counterstrikesharp")
        .join("configs")
        .join("core.json");
    let bot_hider_impl = csgo_dir
        .join("addons")
        .join("counterstrikesharp")
        .join("plugins")
        .join("BotHiderImpl");
    let ray_trace_impl = csgo_dir
        .join("addons")
        .join("counterstrikesharp")
        .join("plugins")
        .join("RayTraceImpl");
    let round_damage_recap = csgo_dir
        .join("addons")
        .join("counterstrikesharp")
        .join("plugins")
        .join("RoundDamageRecap");
    let inventory_simulator = csgo_dir
        .join("addons")
        .join("counterstrikesharp")
        .join("plugins")
        .join("InventorySimulator");
    let plugins_dir = csgo_dir
        .join("addons")
        .join("counterstrikesharp")
        .join("plugins");
    let plugin_names = [
        "BotAI",
        "BotAimImprover",
        "BotBuy",
        "BotState",
        "BotRandomizer",
        "NadeSystem",
        "BotHiderImpl",
        "BotControllerImpl",
        "RayTraceImpl",
        "RoundDamageRecap",
        "InventorySimulator",
    ];
    let mut plugin_versions = HashMap::new();
    for name in &plugin_names {
        let v = read_plugin_version(&plugins_dir, name);
        if !v.is_empty() {
            plugin_versions.insert(name.to_string(), v);
        }
    }

    let css_version = read_plugin_version(
        &csgo_dir.join("addons").join("counterstrikesharp").join("api"),
        "CounterStrikeSharp.API",
    );

    let active_gameinfo = fs::read(csgo_dir.join(GAMEINFO_FILE_NAME)).unwrap_or_default();
    let active_game_mode = if contains_metamod_search_path(&active_gameinfo) {
        "withBots".to_string()
    } else {
        "online".to_string()
    };

    let status = Cs2EnvironmentStatus {
        root_path: root.display().to_string(),
        game_dir_exists: game_dir.exists(),
        csgo_dir_exists: csgo_dir.exists(),
        metamod_exists: metamod.exists(),
        counterstrike_sharp_exists: counterstrike_sharp.exists(),
        gameinfo_exists: gameinfo.exists(),
        active_botprofile_exists: active_botprofile.exists(),
        backup_online_gameinfo_exists: backup_online_gameinfo.exists(),
        backup_withbots_gameinfo_exists: backup_withbots_gameinfo.exists(),
        low_profile_exists: low_profile.exists(),
        medium_profile_exists: medium_profile.exists(),
        high_profile_exists: high_profile.exists(),
        bot_hider_exists: bot_hider.exists(),
        ray_trace_exists: ray_trace.exists(),
        core_config_exists: core_config.exists(),
        bot_hider_impl_exists: bot_hider_impl.exists(),
        ray_trace_impl_exists: ray_trace_impl.exists(),
        round_damage_recap_exists: round_damage_recap.exists(),
        inventory_simulator_exists: inventory_simulator.exists(),
        plugin_versions,
        css_version: if css_version.is_empty() {
            String::new()
        } else {
            css_version
        },
        active_game_mode,
        base_environment_ready: metamod.exists()
            && counterstrike_sharp.exists()
            && gameinfo.exists()
            && active_botprofile.exists()
            && backup_online_gameinfo.exists()
            && backup_withbots_gameinfo.exists()
            && low_profile.exists()
            && medium_profile.exists()
            && high_profile.exists()
            && bot_hider.exists()
            && ray_trace.exists()
            && core_config.exists()
            && bot_hider_impl.exists()
            && ray_trace_impl.exists()
            && round_damage_recap.exists(),
    };

    write_log(
        "INFO",
        &format!(
            "已检查 CS2 目录：{}，环境就绪={}",
            status.root_path, status.base_environment_ready
        ),
    );
    Ok(status)
}

pub fn list_plugins(root_path: &str) -> Result<Vec<PluginInfo>, AppError> {
    let root = normalize_root(root_path)?;
    let plugins_dir = root
        .join("game")
        .join("csgo")
        .join("addons")
        .join("counterstrikesharp")
        .join("plugins");

    if !plugins_dir.exists() {
        return Ok(Vec::new());
    }

    let mut plugins = Vec::new();
    let mut entries: Vec<_> = match fs::read_dir(&plugins_dir) {
        Ok(e) => e.filter_map(|e| e.ok()).collect(),
        Err(_) => return Ok(Vec::new()),
    };
    entries.sort_by_key(|e| e.file_name());

    for entry in entries {
        let name = entry.file_name().to_string_lossy().to_string();
        if name.starts_with('.') {
            continue;
        }

        let (plugin_name, enabled) = if let Some(stripped) = name.strip_suffix(".disabled") {
            (stripped.to_string(), false)
        } else if entry.file_type().map(|t| t.is_dir()).unwrap_or(false) {
            (name.clone(), true)
        } else {
            continue;
        };

        let version = read_plugin_version(&plugins_dir, &plugin_name);
        let config_path = plugins_dir.join(&plugin_name).join("config.json");
        let has_config = config_path.exists()
            || (!enabled && {
                let disabled_path = plugins_dir.join(format!("{}.disabled", &plugin_name));
                disabled_path.join("config.json").exists()
            });

        plugins.push(PluginInfo {
            name: plugin_name,
            version,
            enabled,
            has_config,
        });
    }

    Ok(plugins)
}

pub fn toggle_plugin(root_path: &str, plugin_name: &str) -> Result<PluginInfo, AppError> {
    ensure_cs2_not_running()?;
    let root = normalize_root(root_path)?;
    let plugins_dir = root
        .join("game")
        .join("csgo")
        .join("addons")
        .join("counterstrikesharp")
        .join("plugins");

    let active = plugins_dir.join(plugin_name);
    let disabled = plugins_dir.join(format!("{}.disabled", plugin_name));

    let (enabled, from, to) = if active.exists() {
        (false, active, disabled)
    } else if disabled.exists() {
        (true, disabled, active)
    } else {
        return Err(AppError::runtime(format!(
            "[PLUGIN_NOT_FOUND]\n插件未找到：{}",
            plugin_name
        )));
    };

    fs::rename(&from, &to).map_err(|e| {
        AppError::runtime(format!(
            "[PLUGIN_TOGGLE_FAILED]\n切换插件状态失败：{}\n{}",
            plugin_name, e
        ))
    })?;

    write_log(
        "INFO",
        &format!(
            "插件 {} 状态切换为 {}",
            plugin_name,
            if enabled { "启用" } else { "禁用" }
        ),
    );

    let version = read_plugin_version(&plugins_dir, plugin_name);
    let config_path = to.join("config.json");
    let has_config = config_path.exists();

    Ok(PluginInfo {
        name: plugin_name.to_string(),
        version,
        enabled,
        has_config,
    })
}

pub fn check_cs2_process() -> Result<bool, AppError> {
    let system = System::new_all();
    for process in system.processes().values() {
        let name = process.name().to_string_lossy().to_ascii_lowercase();
        if name == "cs2" || name == "cs2.exe" {
            write_log("INFO", "检测到 cs2.exe 正在运行。");
            return Ok(true);
        }
    }
    Ok(false)
}

pub fn install_bot_package(app: &AppHandle, root_path: &str, variant: Option<&str>) -> Result<OperationResult, AppError> {
    ensure_cs2_not_running()?;

    let root = normalize_root(root_path)?;
    let destination = root.join("game").join("csgo");
    if !destination.exists() {
        return Err(AppError::runtime(format!(
            "[INSTALL_TARGET_MISSING]\n目标目录不存在：{}",
            destination.display()
        )));
    }

    let zip_name = variant.unwrap_or(DEFAULT_BUNDLED_ZIP_NAME);
    let zip_path = resolve_zip_path_with_name(app, zip_name)?;
    ensure_install_destination_ready(&destination)?;
    let cleanup_summary = remove_entire_plugin_package(&destination)?;
    let temp_dir = std::env::temp_dir().join(format!(
        "{}-{}-{}",
        install_temp_prefix(),
        std::process::id(),
        chrono_like_timestamp()
    ));
    let diagnostics = InstallDiagnostics {
        zip_path: zip_path.display().to_string(),
        temp_dir: temp_dir.display().to_string(),
        destination_dir: destination.display().to_string(),
    };

    if temp_dir.exists() {
        fs::remove_dir_all(&temp_dir).map_err(|error| {
            install_io_error(
                "INSTALL_TEMP_CLEANUP_FAILED",
                &temp_dir,
                error,
                Some(&diagnostics),
            )
        })?;
    }
    fs::create_dir_all(&temp_dir).map_err(|error| {
        install_io_error(
            "INSTALL_TEMP_CREATE_FAILED",
            &temp_dir,
            error,
            Some(&diagnostics),
        )
    })?;

    extract_zip(&zip_path, &temp_dir, &diagnostics)?;
    let package_root = find_package_payload_root(&temp_dir, &diagnostics)?;
    copy_dir_contents(&package_root, &destination, &diagnostics)?;
    activate_game_mode_profile(&destination, &GameModePreset::WithBots, Some(&diagnostics))?;
    let _ = fs::remove_dir_all(&temp_dir);

    Ok(OperationResult {
    success: true,
    message: format!(
      "安装完成。\n资源包：{}\n目标目录：{}\n已先彻底删除旧插件包，再完成安装。\n清理目录：{}；清理文件：{}；未找到项：{}。\n请手动把 -insecure 加入 Steam 启动项。",
      diagnostics.zip_path, diagnostics.destination_dir, cleanup_summary.removed_dirs, cleanup_summary.removed_files, cleanup_summary.missing
    ),
  })
}

pub fn apply_difficulty_profile(
    root_path: &str,
    preset: DifficultyPreset,
) -> Result<OperationResult, AppError> {
    ensure_cs2_not_running()?;

    let root = normalize_root(root_path)?;
    let overrides_dir = root.join("game").join("csgo").join("overrides");
    let source = overrides_dir
        .join(preset.as_folder_name())
        .join("botprofile.vpk");
    let destination = overrides_dir.join("botprofile.vpk");
    copy_single_file(&source, &destination, None)?;

    Ok(OperationResult {
        success: true,
        message: format!("Bot 难度已切换为 {}。", preset.as_folder_name()),
    })
}

pub fn set_upstream_aim_preset(root_path: &str, value: &str) -> Result<OperationResult, AppError> {
    ensure_cs2_not_running()?;
    if !matches!(value, "head" | "mixed" | "body") {
        return Err(AppError::runtime(
            "[AIM_PRESET_INVALID]\n不支持的 Aim 预设。",
        ));
    }
    let root = normalize_root(root_path)?;
    let csgo_dir = root.join("game").join("csgo");
    replace_cfg_command_in_upstream_files(&csgo_dir, "bot_aim", &format!("bot_aim {value}"))?;
    Ok(OperationResult {
        success: true,
        message: format!("已写入 Plus Aim 预设：{value}。"),
    })
}

pub fn set_upstream_nades_preset(
    root_path: &str,
    value: &str,
) -> Result<OperationResult, AppError> {
    ensure_cs2_not_running()?;
    if !matches!(value, "max" | "more" | "normal" | "off") {
        return Err(AppError::runtime(
            "[NADES_PRESET_INVALID]\n不支持的投掷物预设。",
        ));
    }
    let root = normalize_root(root_path)?;
    let csgo_dir = root.join("game").join("csgo");
    replace_cfg_command_in_upstream_files(&csgo_dir, "bot_nades", &format!("bot_nades {value}"))?;
    Ok(OperationResult {
        success: true,
        message: format!("已写入 Plus 投掷物预设：{value}。"),
    })
}

pub fn set_game_mode_profile(
    root_path: &str,
    preset: GameModePreset,
) -> Result<OperationResult, AppError> {
    ensure_cs2_not_running()?;

    let root = normalize_root(root_path)?;
    let csgo_dir = root.join("game").join("csgo");
    activate_game_mode_profile(&csgo_dir, &preset, None)?;

    Ok(OperationResult {
        success: true,
        message: match preset {
            GameModePreset::Online => {
                "已切换到在线模式。请从 Steam 启动项删除 -insecure。".to_string()
            }
            GameModePreset::WithBots => {
                "已切换到 Bot 模式。请把 -insecure 加入 Steam 启动项。".to_string()
            }
        },
    })
}

pub fn get_ai_api_config(root_path: &str) -> Result<AiApiConfig, AppError> {
    let root = normalize_root(root_path)?;
    let config_path = bot_taunt_config_path(&root);
    let mut config = AiApiConfig {
        ai_api_url: String::new(),
        ai_api_key: String::new(),
        bot_rivalry_enabled: false,
        config_path: config_path.display().to_string(),
        exists: config_path.exists(),
    };

    if !config_path.exists() {
        return Ok(config);
    }

    let value = read_json_value(&config_path)?;
    config.ai_api_url = value
        .get("AiApiUrl")
        .and_then(serde_json::Value::as_str)
        .unwrap_or_default()
        .to_string();
    config.ai_api_key = value
        .get("AiApiKey")
        .and_then(serde_json::Value::as_str)
        .unwrap_or_default()
        .to_string();
    config.bot_rivalry_enabled = value
        .get("BotRivalryEnabled")
        .and_then(serde_json::Value::as_bool)
        .unwrap_or(false);
    Ok(config)
}

pub fn save_ai_api_config(
    root_path: &str,
    config: AiApiConfig,
) -> Result<OperationResult, AppError> {
    ensure_cs2_not_running()?;

    let root = normalize_root(root_path)?;
    let config_path = bot_taunt_config_path(&root);
    let mut value = if config_path.exists() {
        read_json_value(&config_path)?
    } else {
        serde_json::Value::Object(serde_json::Map::new())
    };

    let Some(object) = value.as_object_mut() else {
        return Err(AppError::runtime(format!(
            "[AI_API_CONFIG_INVALID]\n配置文件不是 JSON 对象：{}",
            config_path.display()
        )));
    };
    object.insert(
        "AiApiUrl".to_string(),
        serde_json::Value::String(config.ai_api_url.trim().to_string()),
    );
    object.insert(
        "AiApiKey".to_string(),
        serde_json::Value::String(config.ai_api_key.trim().to_string()),
    );
    object.insert(
        "BotRivalryEnabled".to_string(),
        serde_json::Value::Bool(config.bot_rivalry_enabled),
    );

    write_json_value(&config_path, &value, "AI_API_CONFIG")?;

    Ok(OperationResult {
        success: true,
        message: format!(
            "BotTaunt 配置已保存。\n配置文件：{}\n重启 CS2 或服务器后生效。",
            config_path.display()
        ),
    })
}

pub fn reset_ai_api_config(root_path: &str) -> Result<AiApiConfig, AppError> {
    ensure_cs2_not_running()?;

    let root = normalize_root(root_path)?;
    let config_path = bot_taunt_config_path(&root);
    let mut value = if config_path.exists() {
        read_json_value(&config_path)?
    } else {
        serde_json::Value::Object(serde_json::Map::new())
    };

    let Some(object) = value.as_object_mut() else {
        return Err(AppError::runtime(format!(
            "[AI_API_CONFIG_INVALID]\n配置文件不是 JSON 对象：{}",
            config_path.display()
        )));
    };
    object.insert(
        "AiApiUrl".to_string(),
        serde_json::Value::String(String::new()),
    );
    object.insert(
        "AiApiKey".to_string(),
        serde_json::Value::String(String::new()),
    );
    object.insert(
        "BotRivalryEnabled".to_string(),
        serde_json::Value::Bool(false),
    );

    write_json_value(&config_path, &value, "AI_API_CONFIG_RESET")?;
    get_ai_api_config(root_path)
}

pub fn get_bot_taunts_config(root_path: &str) -> Result<BotTauntsConfig, AppError> {
    let root = normalize_root(root_path)?;
    let config_path = bot_taunts_config_path(&root);
    let mut config = default_bot_taunts_config(&config_path)?;

    if !config_path.exists() {
        return Ok(config);
    }

    let value = read_json_value(&config_path)?;
    config.normal_taunts = read_string_array_field(&value, "NormalTaunts", &config.normal_taunts);
    config.headshot_taunts =
        read_string_array_field(&value, "HeadshotTaunts", &config.headshot_taunts);
    config.knife_taunts = read_string_array_field(&value, "KnifeTaunts", &config.knife_taunts);
    config.bot_rivalry_taunts =
        read_string_array_field(&value, "BotRivalryTaunts", &config.bot_rivalry_taunts);
    config.opening_trash_talks =
        read_string_array_field(&value, "OpeningTrashTalks", &config.opening_trash_talks);
    config.round_kill_taunt = read_string_field(&value, "RoundKillTaunt", &config.round_kill_taunt);
    config.multi_kill_taunt = read_string_field(&value, "MultiKillTaunt", &config.multi_kill_taunt);
    config.clutch_taunt = read_string_field(&value, "ClutchTaunt", &config.clutch_taunt);
    config.save_taunt = read_string_field(&value, "SaveTaunt", &config.save_taunt);
    config.exists = true;
    Ok(config)
}

pub fn save_bot_taunts_config(
    root_path: &str,
    config: BotTauntsConfig,
) -> Result<OperationResult, AppError> {
    ensure_cs2_not_running()?;

    let root = normalize_root(root_path)?;
    let config_path = bot_taunts_config_path(&root);
    let mut value = if config_path.exists() {
        read_json_value(&config_path)?
    } else {
        default_bot_taunts_value()?
    };

    let Some(object) = value.as_object_mut() else {
        return Err(AppError::runtime(format!(
            "[BOT_TAUNTS_CONFIG_INVALID]\n配置文件不是 JSON 对象：{}",
            config_path.display()
        )));
    };

    let normal_taunts = clean_required_taunts("普通击杀", config.normal_taunts)?;
    let headshot_taunts = clean_required_taunts("爆头击杀", config.headshot_taunts)?;
    let knife_taunts = clean_required_taunts("刀杀", config.knife_taunts)?;
    let bot_rivalry_taunts = clean_required_taunts("BOT 互相嘲讽", config.bot_rivalry_taunts)?;
    let opening_trash_talks = clean_required_taunts("开局嘲讽", config.opening_trash_talks)?;
    let round_kill_taunt = clean_required_taunt_text("单回合 5 杀", config.round_kill_taunt)?;
    let multi_kill_taunt = clean_required_taunt_text("5 秒 3 杀", config.multi_kill_taunt)?;
    let clutch_taunt = clean_required_taunt_text("残局", config.clutch_taunt)?;
    let save_taunt = clean_required_taunt_text("保枪", config.save_taunt)?;

    insert_string_array(object, "NormalTaunts", normal_taunts);
    insert_string_array(object, "HeadshotTaunts", headshot_taunts);
    insert_string_array(object, "KnifeTaunts", knife_taunts);
    insert_string_array(object, "BotRivalryTaunts", bot_rivalry_taunts);
    insert_string_array(object, "OpeningTrashTalks", opening_trash_talks);
    insert_string_field(object, "RoundKillTaunt", round_kill_taunt);
    insert_string_field(object, "MultiKillTaunt", multi_kill_taunt);
    insert_string_field(object, "ClutchTaunt", clutch_taunt);
    insert_string_field(object, "SaveTaunt", save_taunt);

    write_json_value(&config_path, &value, "BOT_TAUNTS_CONFIG")?;

    Ok(OperationResult {
        success: true,
        message: format!(
            "BotTaunt 嘲讽文本已保存。\n配置文件：{}\n重启 CS2 或服务器后生效。",
            config_path.display()
        ),
    })
}

pub fn reset_bot_taunts_config(root_path: &str) -> Result<BotTauntsConfig, AppError> {
    ensure_cs2_not_running()?;

    let root = normalize_root(root_path)?;
    let config_path = bot_taunts_config_path(&root);
    let value = default_bot_taunts_value()?;
    write_json_value(&config_path, &value, "BOT_TAUNTS_CONFIG_RESET")?;

    get_bot_taunts_config(root_path)
}

pub fn get_nade_recovery_config(root_path: &str) -> Result<NadeRecoveryConfig, AppError> {
    let root = normalize_root(root_path)?;
    let config_path = nade_system_config_path(&root);
    let mut config = default_nade_recovery_config(&config_path);

    if !config_path.exists() {
        return Ok(config);
    }

    let value = read_json_value(&config_path)?;
    if let Some(recovery) = value
        .get("ThrowRecoverySeconds")
        .and_then(serde_json::Value::as_object)
    {
        config.flash = read_f64_field(recovery, "flash", config.flash);
        config.smoke = read_f64_field(recovery, "smoke", config.smoke);
        config.he = read_f64_field(recovery, "he", config.he);
        config.molotov = read_f64_field(recovery, "molotov", config.molotov);
        config.incgrenade = read_f64_field(recovery, "incgrenade", config.incgrenade);
        config.decoy = read_f64_field(recovery, "decoy", config.decoy);
    }

    config.exists = true;
    Ok(config)
}

pub fn save_nade_recovery_config(
    root_path: &str,
    config: NadeRecoveryConfig,
) -> Result<OperationResult, AppError> {
    ensure_cs2_not_running()?;

    let root = normalize_root(root_path)?;
    let config_path = nade_system_config_path(&root);
    let mut value = if config_path.exists() {
        read_json_value(&config_path)?
    } else {
        serde_json::Value::Object(serde_json::Map::new())
    };

    let Some(object) = value.as_object_mut() else {
        return Err(AppError::runtime(format!(
            "[NADE_CONFIG_INVALID]\n配置文件不是 JSON 对象：{}",
            config_path.display()
        )));
    };

    let mut recovery = object
        .get("ThrowRecoverySeconds")
        .and_then(serde_json::Value::as_object)
        .cloned()
        .unwrap_or_default();
    insert_seconds(&mut recovery, "flash", config.flash);
    insert_seconds(&mut recovery, "smoke", config.smoke);
    insert_seconds(&mut recovery, "he", config.he);
    insert_seconds(&mut recovery, "molotov", config.molotov);
    insert_seconds(&mut recovery, "incgrenade", config.incgrenade);
    insert_seconds(&mut recovery, "decoy", config.decoy);
    object.insert(
        "ThrowRecoverySeconds".to_string(),
        serde_json::Value::Object(recovery),
    );
    object
        .entry("ConfigVersion".to_string())
        .or_insert(serde_json::Value::Number(1.into()));

    write_json_value(&config_path, &value, "NADE_CONFIG")?;

    Ok(OperationResult {
        success: true,
        message: format!(
            "道具压制开火时间已保存。\n配置文件：{}\n重启 CS2 或服务器后生效。",
            config_path.display()
        ),
    })
}

pub fn reset_nade_recovery_config(root_path: &str) -> Result<NadeRecoveryConfig, AppError> {
    ensure_cs2_not_running()?;

    let root = normalize_root(root_path)?;
    let config_path = nade_system_config_path(&root);
    let config = default_nade_recovery_config(&config_path);
    let mut recovery = serde_json::Map::new();
    insert_seconds(&mut recovery, "flash", config.flash);
    insert_seconds(&mut recovery, "smoke", config.smoke);
    insert_seconds(&mut recovery, "he", config.he);
    insert_seconds(&mut recovery, "molotov", config.molotov);
    insert_seconds(&mut recovery, "incgrenade", config.incgrenade);
    insert_seconds(&mut recovery, "decoy", config.decoy);

    let mut object = serde_json::Map::new();
    object.insert(
        "ThrowRecoverySeconds".to_string(),
        serde_json::Value::Object(recovery),
    );
    object.insert(
        "ConfigVersion".to_string(),
        serde_json::Value::Number(1.into()),
    );

    write_json_value(
        &config_path,
        &serde_json::Value::Object(object),
        "NADE_CONFIG_RESET",
    )?;
    get_nade_recovery_config(root_path)
}

pub fn get_commands_txt(app: &AppHandle) -> Result<CommandsTxtPayload, AppError> {
    let zip_path = resolve_zip_path(app)?;
    let file = File::open(&zip_path).map_err(|error| {
        AppError::runtime(format!(
            "[COMMANDS_TXT_ZIP_OPEN_FAILED]\n打开内置资源包失败：{}\n{}",
            zip_path.display(),
            error
        ))
    })?;
    let mut archive = ZipArchive::new(file).map_err(|error| {
        AppError::runtime(format!(
            "[COMMANDS_TXT_ZIP_READ_FAILED]\n读取内置资源包失败：{}\n{}",
            zip_path.display(),
            error
        ))
    })?;
    let mut entry = archive.by_name(COMMANDS_TXT_FILE_NAME).map_err(|error| {
        AppError::runtime(format!(
            "[COMMANDS_TXT_NOT_FOUND]\n在 {} 中未找到 {}\n{}",
            zip_path.display(),
            COMMANDS_TXT_FILE_NAME,
            error
        ))
    })?;

    let mut content = String::new();
    std::io::Read::read_to_string(&mut entry, &mut content).map_err(|error| {
        AppError::runtime(format!(
            "[COMMANDS_TXT_READ_FAILED]\n从 {} 读取 {} 失败\n{}",
            zip_path.display(),
            COMMANDS_TXT_FILE_NAME,
            error
        ))
    })?;

    Ok(CommandsTxtPayload {
        content,
        source_path: format!("{}!{}", zip_path.display(), COMMANDS_TXT_FILE_NAME),
    })
}

pub fn discover_demos(root_path: &str) -> Result<DemoDiscoveryPayload, AppError> {
    let root = normalize_root(root_path)?;
    let candidates = collect_demo_directory_candidates(&root);
    let recent_demo = find_recent_demo_in_candidates(&candidates);
    let default_directory = default_replays_dir(&root).display().to_string();

    Ok(DemoDiscoveryPayload {
        candidates,
        recent_demo,
        default_directory,
    })
}

pub fn open_recent_demo_directory(root_path: &str) -> Result<OperationResult, AppError> {
    let discovery = discover_demos(root_path)?;
    let target_dir = discovery
        .recent_demo
        .as_ref()
        .map(|demo| PathBuf::from(&demo.directory_path))
        .unwrap_or_else(|| PathBuf::from(&discovery.default_directory));

    if !target_dir.exists() {
        fs::create_dir_all(&target_dir).map_err(|error| {
            install_io_error("REPLAYS_DIR_CREATE_FAILED", &target_dir, error, None)
        })?;
    }

    open_directory(&target_dir, "打开 Demo 目录失败")?;

    let message = if let Some(demo) = discovery.recent_demo {
        format!(
            "已打开最近 Demo 所在目录：{}\n最近 Demo：{}\n时间：{}",
            target_dir.display(),
            demo.file_name,
            demo.modified_at
        )
    } else {
        format!("未找到 Demo，已打开默认目录：{}", target_dir.display())
    };

    Ok(OperationResult {
        success: true,
        message,
    })
}

pub fn open_demo_directory(
    root_path: &str,
    directory_path: &str,
) -> Result<OperationResult, AppError> {
    let discovery = discover_demos(root_path)?;
    let target = PathBuf::from(directory_path.trim());
    let target_display = target.display().to_string();
    let is_candidate = discovery
        .candidates
        .iter()
        .any(|candidate| paths_equal_for_ui(&candidate.path, &target_display));

    if !is_candidate {
        return Err(AppError::runtime(format!(
            "[DEMO_DIRECTORY_NOT_ALLOWED]\n只能打开当前 CS2 game 目录下发现的 replays 目录：{}",
            target.display()
        )));
    }

    if !target.exists() {
        fs::create_dir_all(&target)
            .map_err(|error| install_io_error("REPLAYS_DIR_CREATE_FAILED", &target, error, None))?;
    }

    open_directory(&target, "打开 Demo 目录失败")?;

    Ok(OperationResult {
        success: true,
        message: format!("已打开 Demo 目录：{}", target.display()),
    })
}

pub fn open_diagnostics_log_directory() -> Result<OperationResult, AppError> {
    let log_path = diagnostics_log_path();
    let log_dir = log_path.parent().ok_or_else(|| {
        AppError::runtime(format!(
            "[DIAGNOSTICS_LOG_DIR_MISSING]\n无法确定日志目录：{}",
            log_path.display()
        ))
    })?;

    fs::create_dir_all(log_dir).map_err(|error| {
        install_io_error("DIAGNOSTICS_LOG_DIR_CREATE_FAILED", log_dir, error, None)
    })?;
    open_directory(log_dir, "打开日志位置失败")?;

    Ok(OperationResult {
        success: true,
        message: format!("已打开日志位置：{}", log_dir.display()),
    })
}

fn default_replays_dir(root: &Path) -> PathBuf {
    root.join("game").join("csgo").join("replays")
}

fn collect_demo_directory_candidates(root: &Path) -> Vec<DemoDirectoryCandidate> {
    let game_dir = root.join("game");
    let mut seen = BTreeSet::new();
    let mut candidates = Vec::new();

    add_demo_directory_candidate(
        &mut seen,
        &mut candidates,
        game_dir.join("csgo").join("replays"),
        "默认 csgo",
    );
    add_demo_directory_candidate(
        &mut seen,
        &mut candidates,
        game_dir.join("csgo_lv").join("replays"),
        "默认 csgo_lv",
    );

    if let Ok(entries) = fs::read_dir(&game_dir) {
        for entry in entries.flatten() {
            let layer_dir = entry.path();
            if !layer_dir.is_dir() {
                continue;
            }

            let layer_name = layer_dir
                .file_name()
                .and_then(|value| value.to_str())
                .unwrap_or_default()
                .to_ascii_lowercase();
            let has_gameinfo = layer_dir.join(GAMEINFO_FILE_NAME).exists();
            if !layer_name.starts_with("csgo") && !has_gameinfo {
                continue;
            }

            let replays_dir = layer_dir.join("replays");
            if replays_dir.exists() {
                add_demo_directory_candidate(
                    &mut seen,
                    &mut candidates,
                    replays_dir,
                    "game 目录扫描",
                );
            }
        }
    }

    candidates
}

fn add_demo_directory_candidate(
    seen: &mut BTreeSet<String>,
    candidates: &mut Vec<DemoDirectoryCandidate>,
    path: PathBuf,
    source: &str,
) {
    let display_path = path.display().to_string();
    let key = display_path.to_ascii_lowercase();
    if !seen.insert(key) {
        return;
    }

    candidates.push(DemoDirectoryCandidate {
        path: display_path,
        source: source.to_string(),
        exists: path.is_dir(),
        demo_count: count_demo_files(&path),
    });
}

fn count_demo_files(directory: &Path) -> usize {
    fs::read_dir(directory)
        .map(|entries| {
            entries
                .flatten()
                .filter(|entry| is_demo_file(&entry.path()))
                .count()
        })
        .unwrap_or(0)
}

fn find_recent_demo_in_candidates(candidates: &[DemoDirectoryCandidate]) -> Option<RecentDemoFile> {
    candidates
        .iter()
        .flat_map(|candidate| recent_demo_files_in_directory(Path::new(&candidate.path)))
        .max_by_key(|demo| demo.modified_timestamp)
}

fn recent_demo_files_in_directory(directory: &Path) -> Vec<RecentDemoFile> {
    let Ok(entries) = fs::read_dir(directory) else {
        return Vec::new();
    };

    entries
        .flatten()
        .filter_map(|entry| {
            let path = entry.path();
            if !is_demo_file(&path) {
                return None;
            }
            let metadata = entry.metadata().ok()?;
            let modified = metadata.modified().ok()?;
            let file_name = path.file_name()?.to_string_lossy().to_string();
            Some(RecentDemoFile {
                file_name,
                path: path.display().to_string(),
                directory_path: directory.display().to_string(),
                modified_at: format_system_time(modified),
                modified_timestamp: system_time_unix_seconds(modified),
            })
        })
        .collect()
}

fn is_demo_file(path: &Path) -> bool {
    path.is_file()
        && path
            .extension()
            .and_then(|value| value.to_str())
            .is_some_and(|extension| extension.eq_ignore_ascii_case("dem"))
}

fn format_system_time(time: SystemTime) -> String {
    let local_time: DateTime<Local> = time.into();
    local_time.format("%Y-%m-%d %H:%M:%S").to_string()
}

fn system_time_unix_seconds(time: SystemTime) -> i64 {
    time.duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_secs() as i64)
        .unwrap_or(0)
}

fn paths_equal_for_ui(left: &str, right: &str) -> bool {
    left.eq_ignore_ascii_case(right)
}

fn open_directory(path: &Path, error_prefix: &str) -> Result<(), AppError> {
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(path)
            .spawn()
            .map_err(|error| AppError::runtime(format!("{}：{}", error_prefix, error)))?;
    }

    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(path)
            .spawn()
            .map_err(|error| AppError::runtime(format!("{}：{}", error_prefix, error)))?;
    }

    #[cfg(all(unix, not(target_os = "macos")))]
    {
        std::process::Command::new("xdg-open")
            .arg(path)
            .spawn()
            .map_err(|error| AppError::runtime(format!("{}：{}", error_prefix, error)))?;
    }

    Ok(())
}

pub fn uninstall_bot_package(root_path: &str) -> Result<OperationResult, AppError> {
    ensure_cs2_not_running()?;

    let root = normalize_root(root_path)?;
    let csgo_dir = root.join("game").join("csgo");
    if !csgo_dir.exists() {
        return Err(AppError::runtime(format!(
            "[UNINSTALL_TARGET_MISSING]\n目标目录不存在：{}",
            csgo_dir.display()
        )));
    }

    let summary = remove_entire_plugin_package(&csgo_dir)?;

    Ok(OperationResult {
        success: true,
        message: format!(
            "卸载完成。\n已彻底删除插件目录、插件配置和第三方插件。\n已删除目录：{}\n已删除文件：{}\n未找到项：{}\n不会恢复 gameinfo.gi；需恢复在线模式请单独切换在线模式。",
            summary.removed_dirs, summary.removed_files, summary.missing
        ),
    })
}

#[derive(Debug, Default, PartialEq, Eq)]
struct PluginPackageRemovalSummary {
    removed_dirs: usize,
    removed_files: usize,
    missing: usize,
}

fn remove_entire_plugin_package(csgo_dir: &Path) -> Result<PluginPackageRemovalSummary, AppError> {
    let mut summary = PluginPackageRemovalSummary::default();

    for relative_parts in PLUGIN_PACKAGE_DIRS {
        let path = relative_parts
            .iter()
            .fold(csgo_dir.to_path_buf(), |current, part| current.join(part));
        if path.exists() {
            fs::remove_dir_all(&path).map_err(|error| {
                install_io_error("PLUGIN_PACKAGE_REMOVE_DIR_FAILED", &path, error, None)
            })?;
            summary.removed_dirs += 1;
        } else {
            summary.missing += 1;
        }
    }

    for relative_parts in PLUGIN_PACKAGE_FILES {
        let path = relative_parts
            .iter()
            .fold(csgo_dir.to_path_buf(), |current, part| current.join(part));
        if path.exists() {
            fs::remove_file(&path).map_err(|error| {
                install_io_error("PLUGIN_PACKAGE_REMOVE_FILE_FAILED", &path, error, None)
            })?;
            summary.removed_files += 1;
        } else {
            summary.missing += 1;
        }
    }

    for panel_name in LEGACY_PANEL_FILES {
        let path = csgo_dir.join(panel_name);
        if path.exists() {
            fs::remove_file(&path).map_err(|error| {
                install_io_error("LEGACY_PANEL_REMOVE_FAILED", &path, error, None)
            })?;
            summary.removed_files += 1;
            write_log("INFO", &format!("已删除旧版启动器：{}", path.display()));
        }
    }

    Ok(summary)
}

pub fn get_diagnostics_payload(root_path: Option<&str>) -> Result<DiagnosticsPayload, AppError> {
    let log_path = diagnostics_log_path();
    let full_log = read_log_file(&log_path)?;
    let cs2_running = check_cs2_process()?;
    let mut summary_lines = vec![
        format!("应用：{}", app_name()),
        format!("生成时间：{}", Local::now().format("%Y-%m-%d %H:%M:%S")),
        format!("日志文件：{}", log_path.display()),
        format!("cs2.exe 正在运行：{}", yes_no(cs2_running)),
    ];

    if let Some(root_path) = root_path {
        summary_lines.push(format!("已选择目录：{}", root_path));
        match inspect_cs2_root(root_path) {
            Ok(status) => {
                summary_lines.push(format!("game 目录：{}", yes_no(status.game_dir_exists)));
                summary_lines.push(format!("csgo 目录：{}", yes_no(status.csgo_dir_exists)));
                summary_lines.push(format!("MetaMod：{}", yes_no(status.metamod_exists)));
                summary_lines.push(format!(
                    "CounterStrikeSharp：{}",
                    yes_no(status.counterstrike_sharp_exists)
                ));
                summary_lines.push(format!("gameinfo.gi：{}", yes_no(status.gameinfo_exists)));
                summary_lines.push(format!(
                    "overrides/botprofile.vpk：{}",
                    yes_no(status.active_botprofile_exists)
                ));
                summary_lines.push(format!("BotHider：{}", yes_no(status.bot_hider_exists)));
                summary_lines.push(format!("RayTrace：{}", yes_no(status.ray_trace_exists)));
                summary_lines.push(format!(
                    "CounterStrikeSharp core.json：{}",
                    yes_no(status.core_config_exists)
                ));
                summary_lines.push(format!(
                    "BotHiderImpl：{}",
                    yes_no(status.bot_hider_impl_exists)
                ));
                summary_lines.push(format!(
                    "RayTraceImpl：{}",
                    yes_no(status.ray_trace_impl_exists)
                ));
                summary_lines.push(format!(
                    "RoundDamageRecap：{}",
                    yes_no(status.round_damage_recap_exists)
                ));
                summary_lines.push(format!(
                    "InventorySimulator：{}",
                    yes_no(status.inventory_simulator_exists)
                ));
                summary_lines.push(format!(
                    "当前游戏模式：{}",
                    if status.active_game_mode == "withBots" { "Bot模式" } else { "在线模式" }
                ));
                summary_lines.push(format!(
                    "基础环境就绪：{}",
                    yes_no(status.base_environment_ready)
                ));
            }
            Err(error) => summary_lines.push(format!("检查失败：{}", error.into_string())),
        }
    } else {
        summary_lines.push("尚未选择 CS2 目录。".to_string());
    }

    summary_lines.push(String::new());
    summary_lines.push("最近日志预览：".to_string());
    summary_lines.push(last_log_lines(&full_log, 20));

    Ok(DiagnosticsPayload {
        summary: summary_lines.join("\n"),
        full_log,
        log_path: log_path.display().to_string(),
    })
}

fn bot_taunt_config_path(root: &Path) -> PathBuf {
    BOT_TAUNT_CONFIG_RELATIVE_PATH
        .iter()
        .fold(root.to_path_buf(), |path, part| path.join(part))
}

fn bot_taunts_config_path(root: &Path) -> PathBuf {
    BOT_TAUNTS_CONFIG_RELATIVE_PATH
        .iter()
        .fold(root.to_path_buf(), |path, part| path.join(part))
}

fn nade_system_config_path(root: &Path) -> PathBuf {
    NADE_SYSTEM_CONFIG_RELATIVE_PATH
        .iter()
        .fold(root.to_path_buf(), |path, part| path.join(part))
}

fn default_bot_taunts_config(config_path: &Path) -> Result<BotTauntsConfig, AppError> {
    let value = default_bot_taunts_value()?;
    Ok(BotTauntsConfig {
        normal_taunts: read_string_array_field(&value, "NormalTaunts", &[]),
        headshot_taunts: read_string_array_field(&value, "HeadshotTaunts", &[]),
        knife_taunts: read_string_array_field(&value, "KnifeTaunts", &[]),
        bot_rivalry_taunts: read_string_array_field(&value, "BotRivalryTaunts", &[]),
        opening_trash_talks: read_string_array_field(&value, "OpeningTrashTalks", &[]),
        round_kill_taunt: read_string_field(&value, "RoundKillTaunt", ""),
        multi_kill_taunt: read_string_field(&value, "MultiKillTaunt", ""),
        clutch_taunt: read_string_field(&value, "ClutchTaunt", ""),
        save_taunt: read_string_field(&value, "SaveTaunt", ""),
        config_path: config_path.display().to_string(),
        exists: config_path.exists(),
    })
}

fn default_bot_taunts_value() -> Result<serde_json::Value, AppError> {
    serde_json::from_str(include_str!("../../resources/default-bot-taunts.json")).map_err(|error| {
        AppError::runtime(format!(
            "[BOT_TAUNTS_DEFAULT_INVALID]\n内置 BotTaunt 默认文本不是有效 JSON：{error}"
        ))
    })
}

fn default_nade_recovery_config(config_path: &Path) -> NadeRecoveryConfig {
    NadeRecoveryConfig {
        flash: 0.55,
        smoke: 0.85,
        he: 0.65,
        molotov: 0.8,
        incgrenade: 0.8,
        decoy: 0.55,
        config_path: config_path.display().to_string(),
        exists: config_path.exists(),
    }
}

fn read_json_value(path: &Path) -> Result<serde_json::Value, AppError> {
    let content = fs::read_to_string(path).map_err(|error| {
        AppError::runtime(format!(
            "[CONFIG_READ_FAILED]\n读取配置文件失败：{}\n{}",
            path.display(),
            error
        ))
    })?;

    let content = content.trim_start_matches('\u{feff}');

    serde_json::from_str(content).map_err(|error| {
        AppError::runtime(format!(
            "[CONFIG_PARSE_FAILED]\n配置文件不是有效 JSON：{}\n{}",
            path.display(),
            error
        ))
    })
}

fn write_json_value(path: &Path, value: &serde_json::Value, code: &str) -> Result<(), AppError> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|error| {
            install_io_error(&format!("{code}_PARENT_CREATE_FAILED"), parent, error, None)
        })?;
    }

    let content = serde_json::to_string_pretty(value).map_err(|error| {
        AppError::runtime(format!(
            "[{code}_SERIALIZE_FAILED]\n序列化配置失败：{error}"
        ))
    })?;
    fs::write(path, format!("{content}\n"))
        .map_err(|error| install_io_error(&format!("{code}_WRITE_FAILED"), path, error, None))
}

fn read_string_array_field(
    value: &serde_json::Value,
    key: &str,
    fallback: &[String],
) -> Vec<String> {
    let items = value
        .get(key)
        .and_then(serde_json::Value::as_array)
        .map(|array| {
            array
                .iter()
                .filter_map(serde_json::Value::as_str)
                .map(clean_taunt_line)
                .filter(|item| !item.is_empty())
                .collect::<Vec<_>>()
        })
        .unwrap_or_default();

    if items.is_empty() {
        fallback.to_vec()
    } else {
        items
    }
}

fn read_string_field(value: &serde_json::Value, key: &str, fallback: &str) -> String {
    value
        .get(key)
        .and_then(serde_json::Value::as_str)
        .map(clean_taunt_line)
        .filter(|item| !item.is_empty())
        .unwrap_or_else(|| fallback.to_string())
}

fn clean_required_taunts(field_name: &str, items: Vec<String>) -> Result<Vec<String>, AppError> {
    let cleaned = items
        .into_iter()
        .map(|item| clean_taunt_line(&item))
        .filter(|item| !item.is_empty())
        .collect::<Vec<_>>();

    if cleaned.is_empty() {
        return Err(AppError::runtime(format!(
            "[BOT_TAUNTS_EMPTY]\n{} 至少需要保留一条文本。",
            field_name
        )));
    }

    Ok(cleaned)
}

fn clean_required_taunt_text(field_name: &str, item: String) -> Result<String, AppError> {
    let cleaned = clean_taunt_line(&item);
    if cleaned.is_empty() {
        return Err(AppError::runtime(format!(
            "[BOT_TAUNT_TEXT_EMPTY]\n{} 不能为空。",
            field_name
        )));
    }

    Ok(cleaned)
}

fn clean_taunt_line(item: &str) -> String {
    item.replace(['\r', '\n'], " ").trim().to_string()
}

fn insert_string_array(
    object: &mut serde_json::Map<String, serde_json::Value>,
    key: &str,
    items: Vec<String>,
) {
    object.insert(
        key.to_string(),
        serde_json::Value::Array(items.into_iter().map(serde_json::Value::String).collect()),
    );
}

fn insert_string_field(
    object: &mut serde_json::Map<String, serde_json::Value>,
    key: &str,
    item: String,
) {
    object.insert(key.to_string(), serde_json::Value::String(item));
}

fn read_f64_field(
    object: &serde_json::Map<String, serde_json::Value>,
    key: &str,
    default_value: f64,
) -> f64 {
    object
        .get(key)
        .and_then(serde_json::Value::as_f64)
        .filter(|value| value.is_finite())
        .map(|value| value.clamp(0.0, 5.0))
        .unwrap_or(default_value)
}

fn insert_seconds(object: &mut serde_json::Map<String, serde_json::Value>, key: &str, value: f64) {
    let sanitized = if value.is_finite() {
        value.clamp(0.0, 5.0)
    } else {
        0.0
    };
    if let Some(number) = serde_json::Number::from_f64(sanitized) {
        object.insert(key.to_string(), serde_json::Value::Number(number));
    }
}

fn existing_drives() -> Vec<PathBuf> {
    let mut drives = Vec::new();
    for letter in 'C'..='Z' {
        let drive = PathBuf::from(format!("{letter}:\\"));
        if drive.exists() {
            drives.push(drive);
        }
    }
    drives
}

fn steam_roots_for_drive(drive: &Path) -> Vec<PathBuf> {
    vec![
        drive.join("Program Files (x86)").join("Steam"),
        drive.join("Program Files").join("Steam"),
        drive.join("Steam"),
        drive.join("SteamLibrary"),
    ]
}

fn discover_drive_level_libraries(drive: &Path) -> Result<Vec<PathBuf>, AppError> {
    let mut results = Vec::new();
    let entries = fs::read_dir(drive).map_err(io_error)?;
    for entry in entries {
        let entry = entry.map_err(io_error)?;
        let path = entry.path();
        if !path.is_dir() {
            continue;
        }
        let Some(name) = path.file_name().and_then(|value| value.to_str()) else {
            continue;
        };
        let lower = name.to_ascii_lowercase();
        if lower.contains("steam") && (lower.contains("library") || lower == "steam") {
            results.push(path);
        }
    }
    Ok(results)
}

fn parse_libraryfolders_file(path: &Path) -> Result<Vec<PathBuf>, AppError> {
    let content = fs::read_to_string(path).map_err(io_error)?;
    let mut libraries = Vec::new();

    for line in content.lines() {
        let trimmed = line.trim();
        if !trimmed.contains("\"path\"") {
            continue;
        }
        let quoted = extract_quoted_values(trimmed);
        if let Some(value) = quoted.last() {
            libraries.push(PathBuf::from(value.replace("\\\\", "\\")));
        }
    }
    Ok(libraries)
}

fn extract_quoted_values(line: &str) -> Vec<String> {
    let mut values = Vec::new();
    let mut current = String::new();
    let mut in_quotes = false;

    for ch in line.chars() {
        match ch {
            '"' if in_quotes => {
                values.push(current.clone());
                current.clear();
                in_quotes = false;
            }
            '"' => in_quotes = true,
            _ if in_quotes => current.push(ch),
            _ => {}
        }
    }
    values
}

fn add_candidate_path(
    seen: &mut BTreeSet<String>,
    candidates: &mut Vec<Cs2RootCandidate>,
    path: PathBuf,
    source: &str,
) {
    let Some(resolved) = resolve_root_candidate(&path) else {
        return;
    };
    let normalized = resolved.display().to_string();
    if seen.insert(normalized.clone()) {
        candidates.push(Cs2RootCandidate {
            path: normalized,
            source: source.to_string(),
        });
    }
}

fn normalize_root(root_path: &str) -> Result<PathBuf, AppError> {
    let path = PathBuf::from(root_path.trim());
    if !path.exists() {
        return Err(AppError::runtime(format!(
            "[PATH_NOT_FOUND]\n目录不存在：{}",
            path.display()
        )));
    }
    resolve_root_candidate(&path).ok_or_else(|| {
        AppError::runtime(format!(
            "[INVALID_CS2_ROOT]\n目录不是有效的 CS2 根目录：{}",
            path.display()
        ))
    })
}

fn resolve_root_candidate(path: &Path) -> Option<PathBuf> {
    if !path.exists() {
        return None;
    }
    if is_probable_cs2_root(path) {
        return Some(path.to_path_buf());
    }

    let steam_common_candidate = path.join("steamapps").join("common").join(CS2_FOLDER_NAME);
    if is_probable_cs2_root(&steam_common_candidate) {
        return Some(steam_common_candidate);
    }

    let common_candidate = path.join("common").join(CS2_FOLDER_NAME);
    if is_probable_cs2_root(&common_candidate) {
        return Some(common_candidate);
    }

    if path.file_name().and_then(|value| value.to_str()) == Some("game") {
        if let Some(parent) = path.parent() {
            if is_probable_cs2_root(parent) {
                return Some(parent.to_path_buf());
            }
        }
    }

    if path.file_name().and_then(|value| value.to_str()) == Some("csgo") {
        if let Some(game_dir) = path.parent() {
            if game_dir.file_name().and_then(|value| value.to_str()) == Some("game") {
                if let Some(root) = game_dir.parent() {
                    if is_probable_cs2_root(root) {
                        return Some(root.to_path_buf());
                    }
                }
            }
        }
    }

    None
}

fn is_probable_cs2_root(path: &Path) -> bool {
    if !path.is_dir() {
        return false;
    }
    let game_dir = path.join("game");
    let csgo_dir = game_dir.join("csgo");
    if !game_dir.is_dir() || !csgo_dir.is_dir() {
        return false;
    }
    let root_exe = path.join("cs2.exe");
    let game_exe = game_dir.join("bin").join("win64").join("cs2.exe");
    root_exe.exists() || game_exe.exists() || csgo_dir.is_dir()
}

fn resolve_zip_path(app: &AppHandle) -> Result<PathBuf, AppError> {
    resolve_zip_path_with_name(app, bundled_zip_name())
}

fn resolve_zip_path_with_name(app: &AppHandle, zip_name: &str) -> Result<PathBuf, AppError> {
    let resource_dir = app
        .path()
        .resource_dir()
        .map_err(|error| AppError::runtime(error.to_string()))?;
    let exe_dir = std::env::current_exe()
        .ok()
        .and_then(|path| path.parent().map(Path::to_path_buf));
    let mut candidates = vec![
        resource_dir.join(zip_name),
        resource_dir.join("resources").join(zip_name),
    ];
    if let Some(exe_dir) = exe_dir {
        candidates.push(exe_dir.join(zip_name));
        candidates.push(exe_dir.join("resources").join(zip_name));
    }
    for candidate in &candidates {
        if candidate.exists() {
            return Ok(candidate.clone());
        }
    }
    let fallback = PathBuf::from(fallback_zip_path());
    if fallback.exists() {
        return Ok(fallback);
    }

    let searched = candidates
        .into_iter()
        .map(|path| format!("- {}", path.display()))
        .collect::<Vec<_>>()
        .join("\n");
    Err(AppError::runtime(format!(
        "[INSTALL_ZIP_NOT_FOUND]\n未找到内置资源包 {}。\n已搜索：\n{}",
        zip_name,
        searched
    )))
}

fn extract_zip(
    zip_path: &Path,
    output_dir: &Path,
    diagnostics: &InstallDiagnostics,
) -> Result<(), AppError> {
    let file = File::open(zip_path).map_err(|error| {
        install_io_error(
            "INSTALL_ZIP_OPEN_FAILED",
            zip_path,
            error,
            Some(diagnostics),
        )
    })?;
    let mut archive = ZipArchive::new(file).map_err(|error| {
        AppError::runtime(format!(
            "[INSTALL_ZIP_READ_FAILED]\n读取 zip 失败：{}\n{}\n{}",
            zip_path.display(),
            error,
            format_diagnostics(diagnostics)
        ))
    })?;

    for index in 0..archive.len() {
        let mut entry = archive.by_index(index).map_err(|error| {
            AppError::runtime(format!(
                "[INSTALL_ZIP_ENTRY_FAILED]\n读取 zip 条目失败：{}\n{}",
                zip_path.display(),
                error
            ))
        })?;
        let Some(enclosed_path) = entry.enclosed_name().map(|value| value.to_path_buf()) else {
            continue;
        };
        let output_path = output_dir.join(enclosed_path);
        if entry.is_dir() {
            fs::create_dir_all(&output_path).map_err(|error| {
                install_io_error(
                    "INSTALL_EXTRACT_DIR_FAILED",
                    &output_path,
                    error,
                    Some(diagnostics),
                )
            })?;
            continue;
        }
        if let Some(parent) = output_path.parent() {
            fs::create_dir_all(parent).map_err(|error| {
                install_io_error(
                    "INSTALL_EXTRACT_PARENT_FAILED",
                    parent,
                    error,
                    Some(diagnostics),
                )
            })?;
        }
        let mut output_file = File::create(&output_path).map_err(|error| {
            install_io_error(
                "INSTALL_EXTRACT_FILE_CREATE_FAILED",
                &output_path,
                error,
                Some(diagnostics),
            )
        })?;
        io::copy(&mut entry, &mut output_file).map_err(|error| {
            install_io_error(
                "INSTALL_EXTRACT_FILE_WRITE_FAILED",
                &output_path,
                error,
                Some(diagnostics),
            )
        })?;
    }
    Ok(())
}

fn find_package_payload_root(
    extract_root: &Path,
    diagnostics: &InstallDiagnostics,
) -> Result<PathBuf, AppError> {
    let is_payload_root = |path: &Path| path.join("addons").is_dir();

    if is_payload_root(extract_root) {
        return Ok(extract_root.to_path_buf());
    }

    let entries = fs::read_dir(extract_root).map_err(|error| {
        install_io_error(
            "INSTALL_PACKAGE_ROOT_READ_FAILED",
            extract_root,
            error,
            Some(diagnostics),
        )
    })?;
    let matches = entries
        .filter_map(Result::ok)
        .map(|entry| entry.path())
        .filter(|path| path.is_dir() && is_payload_root(path))
        .collect::<Vec<_>>();

    if matches.len() == 1 {
        return Ok(matches[0].clone());
    }

    Err(AppError::runtime(format!(
        "[INSTALL_PACKAGE_LAYOUT_INVALID]\n资源包缺少 addons 目录。\n{}",
        format_diagnostics(diagnostics)
    )))
}

fn activate_game_mode_profile(
    csgo_dir: &Path,
    preset: &GameModePreset,
    diagnostics: Option<&InstallDiagnostics>,
) -> Result<(), AppError> {
    let destination = csgo_dir.join(GAMEINFO_FILE_NAME);
    let active = fs::read(&destination).map_err(|error| {
        install_io_error(
            "GAME_MODE_ACTIVE_GAMEINFO_READ_FAILED",
            &destination,
            error,
            diagnostics,
        )
    })?;
    let online = rewrite_gameinfo(&active, false).map_err(AppError::runtime)?;
    let with_bots = rewrite_gameinfo(&online, true).map_err(AppError::runtime)?;
    let online_backup = csgo_dir
        .join("backup")
        .join("Online")
        .join(GAMEINFO_FILE_NAME);
    let with_bots_backup = csgo_dir
        .join("backup")
        .join("WithBots")
        .join(GAMEINFO_FILE_NAME);

    for (path, content) in [(&online_backup, &online), (&with_bots_backup, &with_bots)] {
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent).map_err(|error| {
                install_io_error(
                    "GAME_MODE_BACKUP_DIR_CREATE_FAILED",
                    parent,
                    error,
                    diagnostics,
                )
            })?;
        }
        fs::write(path, content).map_err(|error| {
            install_io_error("GAME_MODE_BACKUP_WRITE_FAILED", path, error, diagnostics)
        })?;
    }

    let expected = match preset {
        GameModePreset::Online => &online,
        GameModePreset::WithBots => &with_bots,
    };
    fs::write(&destination, expected).map_err(|error| {
        install_io_error(
            "GAME_MODE_ACTIVE_GAMEINFO_WRITE_FAILED",
            &destination,
            error,
            diagnostics,
        )
    })?;
    if fs::read(&destination).map_err(|error| {
        install_io_error(
            "GAME_MODE_ACTIVE_GAMEINFO_VERIFY_FAILED",
            &destination,
            error,
            diagnostics,
        )
    })? != *expected
    {
        return Err(AppError::runtime(format!(
            "[GAME_MODE_VERIFY_FAILED]\n写入后的 gameinfo.gi 与 {} 模板不一致：{}",
            preset.as_folder_name(),
            destination.display()
        )));
    }
    let installed = fs::read(&destination).map_err(|error| {
        install_io_error(
            "GAME_MODE_ACTIVE_GAMEINFO_VERIFY_FAILED",
            &destination,
            error,
            diagnostics,
        )
    })?;
    match preset {
        GameModePreset::Online if contains_metamod_search_path(&installed) => {
            return Err(AppError::runtime(
                "[GAME_MODE_ONLINE_VERIFY_FAILED]\n在线模式的 gameinfo.gi 仍加载 MetaMod。",
            ));
        }
        GameModePreset::WithBots if !contains_metamod_search_path(&installed) => {
            return Err(AppError::runtime(
                "[GAME_MODE_BOTS_VERIFY_FAILED]\nBot 模式的 gameinfo.gi 未加载 MetaMod。",
            ));
        }
        _ => {}
    }
    Ok(())
}

fn contains_metamod_search_path(bytes: &[u8]) -> bool {
    String::from_utf8_lossy(bytes)
        .to_ascii_lowercase()
        .contains("csgo/addons/metamod")
}

fn game_path_value(line: &str) -> Option<&str> {
    let content = line.split_once("//").map_or(line, |(content, _)| content);
    let mut fields = content.split_whitespace();
    if !fields.next()?.eq_ignore_ascii_case("game") {
        return None;
    }
    let value = fields.next()?;
    if fields.next().is_some() {
        return None;
    }
    Some(value)
}

fn rewrite_gameinfo(bytes: &[u8], include_metamod: bool) -> Result<Vec<u8>, String> {
    let text = std::str::from_utf8(bytes)
        .map_err(|error| format!("gameinfo.gi 不是有效 UTF-8：{error}"))?;
    let newline = if text.contains("\r\n") { "\r\n" } else { "\n" };
    let trailing_newline = text.ends_with('\n');
    let mut output = Vec::new();
    let mut inserted = false;

    for line in text.lines() {
        if game_path_value(line)
            .is_some_and(|value| value.eq_ignore_ascii_case("csgo/addons/metamod"))
        {
            continue;
        }
        if include_metamod
            && !inserted
            && game_path_value(line).is_some_and(|value| value.eq_ignore_ascii_case("csgo"))
        {
            let indent: String = line.chars().take_while(|ch| ch.is_whitespace()).collect();
            output.push(format!("{indent}Game\tcsgo/addons/metamod"));
            inserted = true;
        }
        output.push(line.to_string());
    }

    if include_metamod && !inserted {
        return Err("gameinfo.gi 缺少主 Game csgo SearchPath。".to_string());
    }

    let mut rewritten = output.join(newline);
    if trailing_newline {
        rewritten.push_str(newline);
    }
    Ok(rewritten.into_bytes())
}

fn replace_cfg_command_in_upstream_files(
    csgo_dir: &Path,
    command: &str,
    replacement: &str,
) -> Result<(), AppError> {
    for filename in ["my_bot_normal_config.cfg", "my_bot_ffa_config.cfg"] {
        let path = csgo_dir.join("cfg").join(filename);
        let content = fs::read_to_string(&path)
            .map_err(|error| install_io_error("UPSTREAM_CFG_READ_FAILED", &path, error, None))?;
        let mut found = false;
        let mut lines = Vec::new();
        for line in content.lines() {
            if line.trim_start().starts_with(command) {
                if !found {
                    lines.push(replacement.to_string());
                    found = true;
                }
            } else {
                lines.push(line.to_string());
            }
        }
        if !found {
            lines.push(replacement.to_string());
        }
        fs::write(&path, format!("{}\r\n", lines.join("\r\n")))
            .map_err(|error| install_io_error("UPSTREAM_CFG_WRITE_FAILED", &path, error, None))?;
    }
    Ok(())
}

fn copy_dir_contents(
    source: &Path,
    destination: &Path,
    diagnostics: &InstallDiagnostics,
) -> Result<(), AppError> {
    let entries = fs::read_dir(source).map_err(|error| {
        install_io_error("INSTALL_TEMP_READ_FAILED", source, error, Some(diagnostics))
    })?;
    for entry in entries {
        let entry = entry.map_err(|error| {
            install_io_error(
                "INSTALL_TEMP_ENTRY_FAILED",
                source,
                error,
                Some(diagnostics),
            )
        })?;
        let path = entry.path();
        let target = destination.join(entry.file_name());
        if path.is_dir() {
            fs::create_dir_all(&target).map_err(|error| {
                install_io_error(
                    "INSTALL_TARGET_DIR_CREATE_FAILED",
                    &target,
                    error,
                    Some(diagnostics),
                )
            })?;
            copy_dir_contents(&path, &target, diagnostics)?;
        } else {
            copy_single_file(&path, &target, Some(diagnostics))?;
        }
    }
    Ok(())
}

fn ensure_install_destination_ready(destination: &Path) -> Result<(), AppError> {
    if !destination.is_dir() {
        return Err(AppError::runtime(format!(
            "[INSTALL_TARGET_NOT_DIRECTORY]\n目标路径不是可写目录：{}\n请确认选择的是 CS2 根目录，且 game\\csgo 是真实文件夹。",
            destination.display()
        )));
    }

    let probe_dir = destination.join(format!(
        ".cs2-bot-improver-write-test-{}-{}",
        std::process::id(),
        chrono_like_timestamp()
    ));
    fs::create_dir(&probe_dir).map_err(|error| {
        install_prepare_error(
            "INSTALL_TARGET_WRITE_TEST_FAILED",
            &probe_dir,
            error,
            "无法在 game\\csgo 下新建测试文件夹。请检查 Steam 库目录权限，或确认 game/csgo 不是损坏的目录链接。",
        )
    })?;
    fs::remove_dir(&probe_dir).map_err(|error| {
        install_prepare_error(
            "INSTALL_TARGET_WRITE_TEST_CLEANUP_FAILED",
            &probe_dir,
            error,
            "测试文件夹已创建但无法删除，请手动清理后再重试。",
        )
    })?;

    for directory_name in INSTALL_TOP_LEVEL_DIRS {
        let target = destination.join(directory_name);
        if target.exists() && !target.is_dir() {
            return Err(AppError::runtime(format!(
                "[INSTALL_TARGET_ENTRY_NOT_DIRECTORY]\n目标路径已存在但不是文件夹：{}\n请移走这个同名文件后再安装。",
                target.display()
            )));
        }
        fs::create_dir_all(&target).map_err(|error| {
            install_prepare_error(
                "INSTALL_TOP_LEVEL_DIR_CREATE_FAILED",
                &target,
                error,
                "无法创建安装所需的顶层文件夹。请检查 CS2 目录权限、Steam 库路径或安全软件拦截。",
            )
        })?;
    }

    Ok(())
}

fn copy_single_file(
    source: &Path,
    destination: &Path,
    diagnostics: Option<&InstallDiagnostics>,
) -> Result<(), AppError> {
    if !source.exists() {
        return Err(AppError::runtime(format!(
            "[FILE_NOT_FOUND]\n未找到必需文件：{}\n{}",
            source.display(),
            diagnostics.map(format_diagnostics).unwrap_or_default()
        )));
    }
    if let Some(parent) = destination.parent() {
        fs::create_dir_all(parent).map_err(|error| {
            install_io_error("TARGET_PARENT_CREATE_FAILED", parent, error, diagnostics)
        })?;
    }
    fs::copy(source, destination).map_err(|error| {
        install_io_error("TARGET_FILE_COPY_FAILED", destination, error, diagnostics)
    })?;
    Ok(())
}

fn ensure_cs2_not_running() -> Result<(), AppError> {
    if check_cs2_process()? {
        return Err(AppError::runtime(
            "检测到 cs2.exe 正在运行。请先退出 CS2，再执行此操作。",
        ));
    }
    Ok(())
}

fn io_error(error: io::Error) -> AppError {
    AppError::runtime(error.to_string())
}

fn install_prepare_error(code: &str, path: &Path, error: io::Error, advice: &str) -> AppError {
    let message = format!(
        "[{code}]\n路径：{}\n系统错误：{}\n处理建议：{}",
        path.display(),
        error,
        advice
    );
    write_log("ERROR", &message);
    AppError::runtime(message)
}

fn install_io_error(
    code: &str,
    path: &Path,
    error: io::Error,
    diagnostics: Option<&InstallDiagnostics>,
) -> AppError {
    let message = format!(
        "[{code}]\n路径：{}\n系统错误：{}\n{}",
        path.display(),
        error,
        diagnostics.map(format_diagnostics).unwrap_or_default()
    );
    write_log("ERROR", &message);
    AppError::runtime(message)
}

fn format_diagnostics(diagnostics: &InstallDiagnostics) -> String {
    format!(
        "诊断信息：\n- Zip：{}\n- 临时目录：{}\n- 目标目录：{}",
        diagnostics.zip_path, diagnostics.temp_dir, diagnostics.destination_dir
    )
}

fn chrono_like_timestamp() -> u128 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|duration| duration.as_millis())
        .unwrap_or_default()
}

fn diagnostics_log_path() -> PathBuf {
    let base_dir = std::env::var_os("LOCALAPPDATA")
        .map(PathBuf::from)
        .unwrap_or_else(std::env::temp_dir);
    base_dir
        .join(log_dir_name())
        .join("logs")
        .join("runtime.log")
}

fn write_log(level: &str, message: &str) {
    let log_path = diagnostics_log_path();
    if let Some(parent) = log_path.parent() {
        let _ = fs::create_dir_all(parent);
    }
    if let Ok(mut file) = OpenOptions::new().create(true).append(true).open(&log_path) {
        let line = format!(
            "[{}] [{}] {}\n",
            Local::now().format("%Y-%m-%d %H:%M:%S"),
            level,
            message
        );
        let _ = file.write_all(line.as_bytes());
    }
}

fn read_log_file(path: &Path) -> Result<String, AppError> {
    if !path.exists() {
        return Ok("日志文件尚未创建。".to_string());
    }
    fs::read_to_string(path).map_err(|error| {
        AppError::runtime(format!("读取日志文件失败 {}：{}", path.display(), error))
    })
}

fn last_log_lines(content: &str, line_count: usize) -> String {
    let lines = content.lines().collect::<Vec<_>>();
    let start = lines.len().saturating_sub(line_count);
    lines[start..].join("\n")
}

fn yes_no(value: bool) -> &'static str {
    if value {
        "是"
    } else {
        "否"
    }
}

pub fn list_match_history_files(root_path: &str) -> Result<Vec<String>, AppError> {
    let root = normalize_root(root_path)?;
    let history_dir = root.join("game").join("csgo").join("cs2-match-history");
    if !history_dir.exists() {
        return Ok(Vec::new());
    }

    let mut files = Vec::new();
    let entries = fs::read_dir(&history_dir)
        .map_err(|e| AppError::runtime(format!("读取历史记录目录失败: {}", e)))?;

    for entry in entries.flatten() {
        let path = entry.path();
        if path.extension().and_then(|e| e.to_str()) == Some("json") {
            if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
                files.push(name.to_string());
            }
        }
    }

    files.sort_by(|a, b| b.cmp(a)); // newest first
    Ok(files)
}

pub fn read_match_history_file(root_path: &str, filename: &str) -> Result<String, AppError> {
    let root = normalize_root(root_path)?;
    let file_path = root
        .join("game")
        .join("csgo")
        .join("cs2-match-history")
        .join(filename);

    if !file_path.exists() {
        return Err(AppError::runtime(format!("历史记录文件不存在: {}", filename)));
    }

    fs::read_to_string(&file_path)
        .map_err(|e| AppError::runtime(format!("读取历史记录文件失败: {}", e)))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_dir_target(csgo_dir: &Path, relative_parts: &[&str]) {
        let path = relative_parts
            .iter()
            .fold(csgo_dir.to_path_buf(), |current, part| current.join(part));
        fs::create_dir_all(&path).unwrap();
        fs::write(path.join("marker.txt"), "legacy").unwrap();
    }

    fn create_file_target(csgo_dir: &Path, relative_parts: &[&str]) {
        let path = relative_parts
            .iter()
            .fold(csgo_dir.to_path_buf(), |current, part| current.join(part));
        fs::create_dir_all(path.parent().unwrap()).unwrap();
        fs::write(path, "legacy").unwrap();
    }

    #[test]
    fn drop_knife_marked_block_preserves_other_player_binds() {
        let original = "bind \"f\" \"slot1\"\n// CS2-BOT-IMPROVER-ASSISTANT DROP KNIVES BEGIN\nbind \"\\\" \"subclass_create 500\"\n// CS2-BOT-IMPROVER-ASSISTANT DROP KNIVES END\nbind \"g\" \"drop\"\n";
        let next = format!("{DROP_KNIFE_BEGIN}\nbind \"k\" \"subclass_create 515\"\n{DROP_KNIFE_END}\n");
        let replaced = replace_marked_block(original, &next);

        assert!(replaced.contains("bind \"f\" \"slot1\""));
        assert!(replaced.contains("bind \"g\" \"drop\""));
        assert!(replaced.contains("bind \"k\" \"subclass_create 515\""));
        assert!(!replaced.contains("subclass_create 500"));
    }

    #[test]
    fn plugin_package_removal_deletes_unknown_plugins_and_preserves_cs2_core_files() {
        let root = std::env::temp_dir().join(format!(
            "cs2-uninstall-test-{}-{}",
            std::process::id(),
            chrono_like_timestamp()
        ));
        let csgo_dir = root.join("game").join("csgo");
        fs::create_dir_all(&csgo_dir).unwrap();

        create_dir_target(
            &csgo_dir,
            &[
                "addons",
                "counterstrikesharp",
                "plugins",
                "UnknownThirdParty",
            ],
        );
        create_dir_target(
            &csgo_dir,
            &[
                "addons",
                "counterstrikesharp",
                "configs",
                "plugins",
                "BotTaunt",
            ],
        );
        create_dir_target(&csgo_dir, &["addons", "RayTrace"]);
        create_file_target(&csgo_dir, &["addons", "metamod", "ThirdParty.vdf"]);
        create_dir_target(&csgo_dir, &["plugins", "OtherPlugin"]);
        create_dir_target(&csgo_dir, &["cfg", "plugins", "OtherPlugin"]);
        create_file_target(&csgo_dir, &["metamod.vdf"]);
        create_file_target(&csgo_dir, &["metamod_x64.vdf"]);
        fs::write(csgo_dir.join("cfg").join("autoexec.cfg"), "protected").unwrap();
        fs::write(
            csgo_dir.join("cfg").join("gamemode_competitive.cfg"),
            "protected",
        )
        .unwrap();
        fs::create_dir_all(csgo_dir.join("overrides")).unwrap();
        fs::write(
            csgo_dir.join("overrides").join("botprofile.vpk"),
            "protected",
        )
        .unwrap();
        fs::write(csgo_dir.join("gameinfo.gi"), "protected").unwrap();
        fs::write(csgo_dir.join("pak01_001.vpk"), "protected").unwrap();

        let summary = remove_entire_plugin_package(&csgo_dir).unwrap();

        assert_eq!(summary.removed_dirs, 3);
        assert_eq!(summary.removed_files, 2);
        assert_eq!(summary.missing, 0);
        assert!(!csgo_dir.join("addons").exists());
        assert!(!csgo_dir.join("plugins").exists());
        assert!(!csgo_dir.join("cfg").join("plugins").exists());
        assert!(!csgo_dir.join("metamod.vdf").exists());
        assert!(!csgo_dir.join("metamod_x64.vdf").exists());
        assert!(csgo_dir.join("cfg").join("autoexec.cfg").exists());
        assert!(csgo_dir
            .join("cfg")
            .join("gamemode_competitive.cfg")
            .exists());
        assert!(csgo_dir.join("overrides").join("botprofile.vpk").exists());
        assert!(csgo_dir.join("gameinfo.gi").exists());
        assert!(csgo_dir.join("pak01_001.vpk").exists());

        fs::remove_dir_all(root).unwrap();
    }

    #[test]
    fn install_copy_uses_nested_package_root_and_applies_gameinfo_profiles() {
        let root = std::env::temp_dir().join(format!(
            "cs2-install-quarantine-test-{}-{}",
            std::process::id(),
            chrono_like_timestamp()
        ));
        let csgo_dir = root.join("game").join("csgo");
        create_dir_target(
            &csgo_dir,
            &[
                "addons",
                "counterstrikesharp",
                "plugins",
                "UnknownThirdParty",
            ],
        );
        create_dir_target(&csgo_dir, &["cfg", "plugins", "OldConfig"]);
        create_file_target(&csgo_dir, &["metamod.vdf"]);
        create_file_target(&csgo_dir, &["metamod_x64.vdf"]);
        fs::write(
            csgo_dir.join(GAMEINFO_FILE_NAME),
            "SearchPaths\n{\n\tGame\tcsgo\n}\nCurrentSetting 1\n",
        )
        .unwrap();

        remove_entire_plugin_package(&csgo_dir).unwrap();
        assert!(!csgo_dir.join("addons").exists());
        assert!(!csgo_dir.join("cfg").join("plugins").exists());
        assert!(!csgo_dir.join("metamod.vdf").exists());
        assert!(!csgo_dir.join("metamod_x64.vdf").exists());

        let extract_root = root.join("extracted");
        let source = extract_root.join("LBTVCS2BotEnhancer");
        fs::create_dir_all(
            source
                .join("addons")
                .join("counterstrikesharp")
                .join("plugins")
                .join("BundledPlugin"),
        )
        .unwrap();
        fs::create_dir_all(source.join("backup").join("Online")).unwrap();
        fs::create_dir_all(source.join("backup").join("WithBots")).unwrap();
        fs::write(
            source
                .join("addons")
                .join("counterstrikesharp")
                .join("plugins")
                .join("BundledPlugin")
                .join("BundledPlugin.dll"),
            "bundled",
        )
        .unwrap();
        fs::write(source.join("addons").join("metamod.vdf"), "bundled").unwrap();
        fs::write(source.join("addons").join("metamod_x64.vdf"), "bundled").unwrap();
        let diagnostics = InstallDiagnostics {
            zip_path: "test.zip".to_string(),
            temp_dir: extract_root.display().to_string(),
            destination_dir: csgo_dir.display().to_string(),
        };
        let package_root = find_package_payload_root(&extract_root, &diagnostics).unwrap();
        assert_eq!(package_root, source);
        copy_dir_contents(&package_root, &csgo_dir, &diagnostics).unwrap();
        activate_game_mode_profile(&csgo_dir, &GameModePreset::WithBots, Some(&diagnostics))
            .unwrap();

        assert!(csgo_dir
            .join("addons")
            .join("counterstrikesharp")
            .join("plugins")
            .join("BundledPlugin")
            .join("BundledPlugin.dll")
            .exists());
        assert!(csgo_dir.join("addons").join("metamod.vdf").exists());
        assert!(csgo_dir.join("addons").join("metamod_x64.vdf").exists());
        assert!(!csgo_dir.join("metamod.vdf").exists());
        assert!(!csgo_dir.join("metamod_x64.vdf").exists());
        assert_eq!(
            fs::read_to_string(csgo_dir.join(GAMEINFO_FILE_NAME)).unwrap(),
            fs::read_to_string(
                csgo_dir
                    .join("backup")
                    .join("WithBots")
                    .join(GAMEINFO_FILE_NAME)
            )
            .unwrap()
        );
        assert!(contains_metamod_search_path(
            &fs::read(csgo_dir.join(GAMEINFO_FILE_NAME)).unwrap()
        ));
        assert!(!csgo_dir
            .join("addons")
            .join("counterstrikesharp")
            .join("plugins")
            .join("UnknownThirdParty")
            .exists());

        activate_game_mode_profile(&csgo_dir, &GameModePreset::Online, None).unwrap();
        assert_eq!(
            fs::read_to_string(csgo_dir.join(GAMEINFO_FILE_NAME)).unwrap(),
            fs::read_to_string(
                csgo_dir
                    .join("backup")
                    .join("Online")
                    .join(GAMEINFO_FILE_NAME)
            )
            .unwrap()
        );
        assert!(!contains_metamod_search_path(
            &fs::read(csgo_dir.join(GAMEINFO_FILE_NAME)).unwrap()
        ));

        fs::remove_dir_all(root).unwrap();
    }
}
