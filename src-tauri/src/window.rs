use std::sync::Mutex;

use serde::Deserialize;
use tauri::{AppHandle, Manager, State, WebviewWindow};

pub const MAIN_WINDOW: &str = "main";

/// 点击主窗口关闭按钮时的行为，由前端设置页同步（见 src/stores/settings.ts）
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum CloseBehavior {
    /// 隐藏到托盘（macOS 同时驻留 Dock）
    #[default]
    Minimize,
    Exit,
}

#[derive(Default)]
pub struct WindowSettings {
    close_behavior: Mutex<CloseBehavior>,
}

impl WindowSettings {
    pub fn close_behavior(&self) -> CloseBehavior {
        *self.close_behavior.lock().unwrap()
    }
}

#[tauri::command]
pub fn set_close_behavior(behavior: CloseBehavior, settings: State<'_, WindowSettings>) {
    *settings.close_behavior.lock().unwrap() = behavior;
}

pub fn main_window(app: &AppHandle) -> Option<WebviewWindow> {
    app.get_webview_window(MAIN_WINDOW)
}

pub fn show_main_window(app: &AppHandle) {
    let Some(window) = main_window(app) else {
        return;
    };
    let _ = window.unminimize();
    let _ = window.show();
    let _ = window.set_focus();
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn close_behavior_defaults_to_minimize() {
        assert_eq!(
            WindowSettings::default().close_behavior(),
            CloseBehavior::Minimize
        );
    }

    #[test]
    fn close_behavior_deserializes_from_frontend_values() {
        let parsed: CloseBehavior = serde_json::from_str("\"exit\"").unwrap();
        assert_eq!(parsed, CloseBehavior::Exit);
        let parsed: CloseBehavior = serde_json::from_str("\"minimize\"").unwrap();
        assert_eq!(parsed, CloseBehavior::Minimize);
    }
}
