use std::collections::HashMap;
use std::sync::Mutex;

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, Manager, Runtime, State};
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
}

impl GlobalAction {
    fn command(self) -> PlayerCommand {
        match self {
            Self::TogglePlay => PlayerCommand::Toggle,
            Self::Prev => PlayerCommand::Prev,
            Self::Next => PlayerCommand::Next,
        }
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

pub fn plugin<R: Runtime>() -> tauri::plugin::TauriPlugin<R> {
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
                if let Err(error) = app.emit_to(MAIN_WINDOW, PLAYER_COMMAND, action.command()) {
                    log::warn!("发送全局快捷键指令失败: {error}");
                }
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
mod tests {
    use super::*;

    #[test]
    fn deserializes_bindings_from_frontend() {
        let bindings: Vec<ShortcutBinding> = serde_json::from_str(
            r#"[{"action":"toggle-play","accelerator":"CommandOrControl+Alt+Space"}]"#,
        )
        .unwrap();
        assert_eq!(bindings[0].action, GlobalAction::TogglePlay);
        assert_eq!(bindings[0].action.command(), PlayerCommand::Toggle);
    }

    #[test]
    fn parses_default_accelerators() {
        for accelerator in [
            "CommandOrControl+Alt+Space",
            "CommandOrControl+Alt+Left",
            "CommandOrControl+Alt+Right",
        ] {
            assert!(accelerator.parse::<Shortcut>().is_ok(), "{accelerator}");
        }
    }
}
