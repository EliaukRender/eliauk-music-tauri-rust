use std::collections::HashMap;
use std::sync::Mutex;

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, Manager, State};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};

use crate::events::{PlayerCommand, PLAYER_COMMAND};
use crate::window::MAIN_WINDOW;

/// 与前端 src/constants/hotkeys.ts 的 GlobalAction 保持一致
#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum GlobalAction {
    TogglePlay,
    Prev,
    Next,
    ToggleMini,
}

impl GlobalAction {
    /// 返回 None 的动作由 Rust 端直接处理
    fn command(self) -> Option<PlayerCommand> {
        match self {
            Self::TogglePlay => Some(PlayerCommand::Toggle),
            Self::Prev => Some(PlayerCommand::Prev),
            Self::Next => Some(PlayerCommand::Next),
            Self::ToggleMini => None,
        }
    }
}

fn dispatch(app: &AppHandle, action: GlobalAction) {
    let result = match action.command() {
        Some(command) => app
            .emit_to(MAIN_WINDOW, PLAYER_COMMAND, command)
            .map_err(|e| e.to_string()),
        None => crate::window::mini::toggle(app).map_err(|e| e.to_string()),
    };
    if let Err(error) = result {
        log::warn!("执行全局快捷键 {action:?} 失败: {error}");
    }
}

#[derive(Debug, Deserialize)]
pub struct ShortcutBinding {
    pub action: GlobalAction,
    /// 形如 `CommandOrControl+Alt+Space`
    pub accelerator: String,
}

#[derive(Debug, Serialize)]
pub struct ShortcutFailure {
    pub accelerator: String,
    pub reason: String,
}

/// 快捷键 id 到动作的映射，由插件回调查询
#[derive(Default)]
pub struct ShortcutRegistry(Mutex<HashMap<u32, GlobalAction>>);

pub fn plugin() -> tauri::plugin::TauriPlugin<tauri::Wry> {
    tauri_plugin_global_shortcut::Builder::new()
        .with_handler(|app, shortcut, event| {
            if event.state != ShortcutState::Pressed {
                return;
            }
            let action = app
                .state::<ShortcutRegistry>()
                .0
                .lock()
                .ok()
                .and_then(|map| map.get(&shortcut.id()).copied());
            if let Some(action) = action {
                dispatch(app, action);
            }
        })
        .build()
}

/// 整体替换已注册的全局快捷键；传空列表即关闭。返回注册失败（格式错误或被占用）的项
#[tauri::command]
pub fn set_global_shortcuts(
    app: AppHandle,
    bindings: Vec<ShortcutBinding>,
    registry: State<'_, ShortcutRegistry>,
) -> Result<Vec<ShortcutFailure>, String> {
    let manager = app.global_shortcut();
    manager.unregister_all().map_err(|e| e.to_string())?;
    let mut map = registry.0.lock().map_err(|e| e.to_string())?;
    map.clear();

    let mut failures = Vec::new();
    for binding in bindings {
        let result = binding
            .accelerator
            .parse::<Shortcut>()
            .map_err(|e| e.to_string())
            .and_then(|shortcut| {
                manager.register(shortcut).map_err(|e| e.to_string())?;
                Ok(shortcut)
            });
        match result {
            Ok(shortcut) => {
                map.insert(shortcut.id(), binding.action);
            }
            Err(reason) => failures.push(ShortcutFailure {
                accelerator: binding.accelerator,
                reason,
            }),
        }
    }
    Ok(failures)
}

#[cfg(test)]
mod tests;
