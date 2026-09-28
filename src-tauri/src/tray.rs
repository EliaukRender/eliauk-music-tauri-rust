use std::sync::Mutex;

use serde::Deserialize;
use tauri::image::Image;
use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::TrayIconBuilder;
#[cfg(not(target_os = "macos"))]
use tauri::tray::{MouseButton, MouseButtonState, TrayIconEvent};
use tauri::{AppHandle, Emitter, Manager, State, Wry};

use crate::events::{PlayerCommand, PLAYER_COMMAND};
use crate::window::{show_main_window, MAIN_WINDOW};

const TRAY_ID: &str = "main-tray";
const MENU_NOW_PLAYING: &str = "tray-now-playing";
const MENU_TOGGLE: &str = "tray-toggle";
const MENU_PREV: &str = "tray-prev";
const MENU_NEXT: &str = "tray-next";
const MENU_SHOW: &str = "tray-show";
const MENU_QUIT: &str = "tray-quit";

const APP_NAME: &str = "Eliauk 音乐";
/// 菜单项过长会把托盘菜单撑得很宽
const MAX_LABEL_CHARS: usize = 28;

/// 前端推送的播放状态，见 src/services/tauri/system-bridge.ts
#[derive(Debug, Clone, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TrayPlayerState {
    pub title: Option<String>,
    pub artist: Option<String>,
    pub is_playing: bool,
}

/// 需要动态更新文案的菜单项句柄
pub struct TrayMenuHandles {
    now_playing: MenuItem<Wry>,
    toggle: MenuItem<Wry>,
    state: Mutex<TrayPlayerState>,
}

fn truncate(text: &str) -> String {
    if text.chars().count() <= MAX_LABEL_CHARS {
        return text.to_string();
    }
    let head: String = text.chars().take(MAX_LABEL_CHARS - 1).collect();
    format!("{head}…")
}

pub fn now_playing_label(state: &TrayPlayerState) -> String {
    match (&state.title, &state.artist) {
        (Some(title), Some(artist)) if !artist.is_empty() => {
            truncate(&format!("{title} - {artist}"))
        }
        (Some(title), _) => truncate(title),
        _ => "暂无播放".to_string(),
    }
}

pub fn toggle_label(state: &TrayPlayerState) -> &'static str {
    if state.is_playing {
        "暂停"
    } else {
        "播放"
    }
}

fn send_command(app: &AppHandle, command: PlayerCommand) {
    if let Err(error) = app.emit_to(MAIN_WINDOW, PLAYER_COMMAND, command) {
        log::warn!("发送播放指令失败: {error}");
    }
}

pub fn init(app: &AppHandle) -> tauri::Result<()> {
    let initial = TrayPlayerState::default();
    let now_playing = MenuItem::with_id(
        app,
        MENU_NOW_PLAYING,
        now_playing_label(&initial),
        false,
        None::<&str>,
    )?;
    let toggle = MenuItem::with_id(app, MENU_TOGGLE, toggle_label(&initial), true, None::<&str>)?;
    let prev = MenuItem::with_id(app, MENU_PREV, "上一首", true, None::<&str>)?;
    let next = MenuItem::with_id(app, MENU_NEXT, "下一首", true, None::<&str>)?;
    let show = MenuItem::with_id(app, MENU_SHOW, "显示主界面", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, MENU_QUIT, "退出", true, None::<&str>)?;
    let menu = Menu::with_items(
        app,
        &[
            &now_playing,
            &PredefinedMenuItem::separator(app)?,
            &toggle,
            &prev,
            &next,
            &PredefinedMenuItem::separator(app)?,
            &show,
            &quit,
        ],
    )?;

    app.manage(TrayMenuHandles {
        now_playing,
        toggle,
        state: Mutex::new(initial),
    });

    let builder = TrayIconBuilder::with_id(TRAY_ID)
        .tooltip(APP_NAME)
        .menu(&menu)
        .on_menu_event(|app, event| match event.id.as_ref() {
            MENU_TOGGLE => send_command(app, PlayerCommand::Toggle),
            MENU_PREV => send_command(app, PlayerCommand::Prev),
            MENU_NEXT => send_command(app, PlayerCommand::Next),
            MENU_SHOW => show_main_window(app),
            MENU_QUIT => app.exit(0),
            _ => {}
        });

    // macOS 菜单栏要求单色 template 图标以适配深浅色；Windows 托盘使用彩色图标并响应左键
    #[cfg(target_os = "macos")]
    let builder = builder
        .icon(Image::from_bytes(include_bytes!(
            "../icons/tray/tray-template@2x.png"
        ))?)
        .icon_as_template(true)
        .show_menu_on_left_click(true);

    #[cfg(not(target_os = "macos"))]
    let builder = builder
        .icon(Image::from_bytes(include_bytes!("../icons/tray/tray.png"))?)
        .show_menu_on_left_click(false)
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                show_main_window(tray.app_handle());
            }
        });

    builder.build(app)?;
    Ok(())
}

/// 前端在歌曲或播放状态变化时调用，只更新变化的部分
#[tauri::command]
pub fn sync_player_state(
    app: AppHandle,
    state: TrayPlayerState,
    handles: State<'_, TrayMenuHandles>,
) -> Result<(), String> {
    let mut current = handles.state.lock().map_err(|e| e.to_string())?;
    let label = now_playing_label(&state);
    if label != now_playing_label(&current) {
        handles
            .now_playing
            .set_text(&label)
            .map_err(|e| e.to_string())?;
        if let Some(tray) = app.tray_by_id(TRAY_ID) {
            let tooltip = if state.title.is_some() {
                label.as_str()
            } else {
                APP_NAME
            };
            tray.set_tooltip(Some(tooltip)).map_err(|e| e.to_string())?;
        }
    }
    if state.is_playing != current.is_playing {
        handles
            .toggle
            .set_text(toggle_label(&state))
            .map_err(|e| e.to_string())?;
    }
    *current = state;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn state(title: Option<&str>, artist: Option<&str>) -> TrayPlayerState {
        TrayPlayerState {
            title: title.map(Into::into),
            artist: artist.map(Into::into),
            is_playing: false,
        }
    }

    #[test]
    fn formats_now_playing_label() {
        assert_eq!(now_playing_label(&state(None, None)), "暂无播放");
        assert_eq!(
            now_playing_label(&state(Some("海屿你"), Some("马也"))),
            "海屿你 - 马也"
        );
        assert_eq!(
            now_playing_label(&state(Some("海屿你"), Some(""))),
            "海屿你"
        );
    }

    #[test]
    fn truncates_long_label_by_chars() {
        let title = "很".repeat(40);
        let label = now_playing_label(&state(Some(&title), None));
        assert_eq!(label.chars().count(), MAX_LABEL_CHARS);
        assert!(label.ends_with('…'));
    }

    #[test]
    fn deserializes_frontend_payload() {
        let parsed: TrayPlayerState =
            serde_json::from_str(r#"{"title":"a","artist":null,"isPlaying":true}"#).unwrap();
        assert!(parsed.is_playing);
        assert_eq!(toggle_label(&parsed), "暂停");
    }
}
