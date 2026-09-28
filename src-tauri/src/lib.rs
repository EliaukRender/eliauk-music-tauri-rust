mod api_server;
mod tray;
mod window;

use tauri::{Manager, RunEvent, WindowEvent};
use tauri_plugin_log::{Target, TargetKind};
use tauri_plugin_window_state::StateFlags;

use crate::window::{show_main_window, CloseBehavior, WindowSettings, MAIN_WINDOW};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default()
        // single-instance 必须最先注册，才能在第二实例启动早期拦截
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            show_main_window(app);
        }))
        .plugin(
            tauri_plugin_log::Builder::new()
                .targets([
                    Target::new(TargetKind::Stdout),
                    Target::new(TargetKind::LogDir { file_name: None }),
                    Target::new(TargetKind::Webview),
                ])
                .level(if cfg!(debug_assertions) {
                    log::LevelFilter::Debug
                } else {
                    log::LevelFilter::Info
                })
                .build(),
        )
        .plugin(
            // 不恢复可见性：macOS 隐藏到 Dock 后退出，下次启动不应保持隐藏
            tauri_plugin_window_state::Builder::new()
                .with_state_flags(StateFlags::all() & !StateFlags::VISIBLE)
                .build(),
        )
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_os::init());

    #[cfg(feature = "embedded-api")]
    let builder = builder.plugin(tauri_plugin_shell::init());

    let app = builder
        .manage(WindowSettings::default())
        .invoke_handler(tauri::generate_handler![
            api_server::get_api_endpoint,
            window::set_close_behavior
        ])
        .setup(|app| {
            #[cfg(feature = "embedded-api")]
            api_server::init(app.handle());

            tray::init(app.handle())?;
            Ok(())
        })
        .on_window_event(|window, event| {
            let WindowEvent::CloseRequested { api, .. } = event else {
                return;
            };
            if window.label() != MAIN_WINDOW {
                return;
            }
            match window.state::<WindowSettings>().close_behavior() {
                CloseBehavior::Minimize => {
                    api.prevent_close();
                    let _ = window.hide();
                }
                CloseBehavior::Exit => window.app_handle().exit(0),
            }
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    app.run(|app, event| match event {
        #[cfg(target_os = "macos")]
        RunEvent::Reopen { .. } => show_main_window(app),
        RunEvent::Exit => {
            #[cfg(feature = "embedded-api")]
            api_server::shutdown(app);
            let _ = app;
        }
        _ => {}
    });
}
