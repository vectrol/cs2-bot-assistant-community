mod commands;
mod errors;
mod models;
mod services;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.unminimize();
                let _ = window.show();
                let _ = window.set_focus();
            }
        }))
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            crate::services::monitor::start_monitor(app.handle());

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::app::get_runtime_context,
            commands::app::open_external_url,
            commands::app::launch_cs2_game,
            commands::app::launch_cs2_direct,
            commands::app::open_inventory_window,
            commands::app::enable_autostart,
            commands::app::disable_autostart,
            commands::app::is_autostart_enabled,
            commands::custom_commands::load_custom_commands,
            commands::custom_commands::save_custom_commands,
            commands::cs2::discover_cs2_roots,
            commands::cs2::inspect_cs2_root,
            commands::cs2::install_bot_package,
            commands::cs2::apply_difficulty_profile,
            commands::cs2::set_upstream_aim_preset,
            commands::cs2::set_upstream_nades_preset,
            commands::cs2::set_game_mode_profile,
            commands::cs2::get_ai_api_config,
            commands::cs2::save_ai_api_config,
            commands::cs2::reset_ai_api_config,
            commands::cs2::get_bot_taunts_config,
            commands::cs2::save_bot_taunts_config,
            commands::cs2::reset_bot_taunts_config,
            commands::cs2::get_nade_recovery_config,
            commands::cs2::save_nade_recovery_config,
            commands::cs2::reset_nade_recovery_config,
            commands::cs2::get_commands_txt,
            commands::cs2::discover_demos,
            commands::cs2::open_recent_demo_directory,
            commands::cs2::open_demo_directory,
            commands::cs2::open_replays_directory,
            commands::cs2::open_diagnostics_log_directory,
            commands::cs2::uninstall_bot_package,
            commands::cs2::check_cs2_process,
            commands::cs2::get_diagnostics_payload,
            commands::cs2::list_plugins,
            commands::cs2::toggle_plugin,
            commands::resource::get_resource_pack_info,
            commands::resource::create_backup,
            commands::resource::list_backups,
            commands::resource::restore_backup,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
