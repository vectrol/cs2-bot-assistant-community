use std::sync::atomic::{AtomicBool, Ordering};
use std::time::Duration;

use chrono::Utc;
use serde::Serialize;
use sysinfo::System;
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Emitter, Manager};
use tokio::time::sleep;

static MONITOR_RUNNING: AtomicBool = AtomicBool::new(false);

#[derive(Clone, Serialize)]
pub struct Cs2ProcessEvent {
    pub running: bool,
    pub timestamp: String,
}

pub fn start_monitor(app: &AppHandle) {
    setup_tray(app);

    if MONITOR_RUNNING
        .compare_exchange(false, true, Ordering::SeqCst, Ordering::SeqCst)
        .is_err()
    {
        return;
    }

    let handle = app.clone();
    tauri::async_runtime::spawn(async move {
        let mut system = System::new();
        let mut last_state: Option<bool> = None;
        let cs2_names: [&str; 2] = ["cs2", "cs2.exe"];

        loop {
            if !MONITOR_RUNNING.load(Ordering::SeqCst) {
                break;
            }

            system.refresh_all();

            let found = system.processes().values().any(|p| {
                let name = p.name().to_string_lossy().to_ascii_lowercase();
                cs2_names.contains(&name.as_str())
            });

            let changed = last_state.map_or(true, |st| st != found);

            if changed {
                last_state = Some(found);
                let event = Cs2ProcessEvent {
                    running: found,
                    timestamp: Utc::now().format("%Y-%m-%dT%H:%M:%S%.3fZ").to_string(),
                };
                let _ = handle.emit("cs2-process-changed", event);
            }

            sleep(Duration::from_secs(2)).await;
        }
    });
}

pub fn stop_monitor() {
    MONITOR_RUNNING.store(false, Ordering::SeqCst);
}

fn setup_tray(app: &AppHandle) {
    let Some(icon) = app.default_window_icon().cloned() else {
        return;
    };

    let _ = TrayIconBuilder::with_id("main-tray")
        .icon(icon)
        .tooltip("CS2人机助手社区版")
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                if let Some(window) = tray.app_handle().get_webview_window("main") {
                    let _ = window.unminimize();
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
        })
        .build(app);
}
