//! 系统媒体中心：Windows SMTC、macOS「正在播放」与媒体键

use std::sync::Mutex;
use std::time::Duration;

use souvlaki::{
    MediaControlEvent, MediaControls, MediaMetadata, MediaPlayback, MediaPosition, PlatformConfig,
    SeekDirection,
};
use tauri::{AppHandle, Emitter, Manager};

use crate::events::{PlayerCommand, PLAYER_COMMAND};
use crate::player_sync::PlayerSnapshot;
use crate::window::{show_main_window, MAIN_WINDOW};

/// 系统只给出方向、没有给出步长时的默认值（秒）
const DEFAULT_SEEK_STEP: f64 = 5.0;

/// 初始化失败时为 None，其余功能不受影响
pub struct MediaControlsState {
    controls: Mutex<Option<MediaControls>>,
    last: Mutex<PlayerSnapshot>,
}

pub fn command_for(event: &MediaControlEvent) -> Option<PlayerCommand> {
    let signed = |direction: &SeekDirection, seconds: f64| match direction {
        SeekDirection::Forward => seconds,
        SeekDirection::Backward => -seconds,
    };
    Some(match event {
        MediaControlEvent::Play => PlayerCommand::Play,
        MediaControlEvent::Pause => PlayerCommand::Pause,
        MediaControlEvent::Toggle => PlayerCommand::Toggle,
        MediaControlEvent::Next => PlayerCommand::Next,
        MediaControlEvent::Previous => PlayerCommand::Prev,
        MediaControlEvent::SetPosition(MediaPosition(position)) => PlayerCommand::Seek {
            position: position.as_secs_f64(),
        },
        MediaControlEvent::Seek(direction) => PlayerCommand::SeekBy {
            delta: signed(direction, DEFAULT_SEEK_STEP),
        },
        MediaControlEvent::SeekBy(direction, amount) => PlayerCommand::SeekBy {
            delta: signed(direction, amount.as_secs_f64()),
        },
        _ => return None,
    })
}

fn create(app: &AppHandle) -> Result<MediaControls, String> {
    // Windows 的 SMTC 需要绑定到具体窗口
    #[cfg(windows)]
    let hwnd = {
        let window = crate::window::main_window(app).ok_or("主窗口不存在")?;
        Some(window.hwnd().map_err(|e| e.to_string())?.0)
    };
    #[cfg(not(windows))]
    let hwnd = None;

    let mut controls = MediaControls::new(PlatformConfig {
        display_name: "Eliauk 音乐",
        dbus_name: "eliauk_music",
        hwnd,
    })
    .map_err(|e| format!("{e:?}"))?;

    let handle = app.clone();
    controls
        .attach(move |event| {
            if matches!(event, MediaControlEvent::Raise) {
                show_main_window(&handle);
                return;
            }
            if let Some(command) = command_for(&event) {
                if let Err(error) = handle.emit_to(MAIN_WINDOW, PLAYER_COMMAND, command) {
                    log::warn!("发送媒体键指令失败: {error}");
                }
            }
        })
        .map_err(|e| format!("{e:?}"))?;
    Ok(controls)
}

pub fn init(app: &AppHandle) {
    let controls = create(app)
        .inspect_err(|error| log::warn!("系统媒体中心初始化失败: {error}"))
        .ok();
    app.manage(MediaControlsState {
        controls: Mutex::new(controls),
        last: Mutex::new(PlayerSnapshot::default()),
    });
}

pub fn update(app: &AppHandle, state: &PlayerSnapshot) {
    let Some(managed) = app.try_state::<MediaControlsState>() else {
        return;
    };
    let (Ok(mut controls), Ok(mut last)) = (managed.controls.lock(), managed.last.lock()) else {
        return;
    };
    let Some(controls) = controls.as_mut() else {
        return;
    };

    let metadata_changed = last.title != state.title
        || last.artist != state.artist
        || last.album != state.album
        || last.cover_url != state.cover_url
        || last.duration != state.duration;
    if metadata_changed {
        let result = controls.set_metadata(MediaMetadata {
            title: state.title.as_deref(),
            artist: state.artist.as_deref(),
            album: state.album.as_deref(),
            cover_url: state.cover_url.as_deref(),
            duration: (state.duration > 0.0).then(|| Duration::from_secs_f64(state.duration)),
        });
        if let Err(error) = result {
            log::warn!("更新媒体信息失败: {error:?}");
        }
    }

    let progress = Some(MediaPosition(Duration::from_secs_f64(
        state.position.max(0.0),
    )));
    let playback = match (&state.title, state.is_playing) {
        (None, _) => MediaPlayback::Stopped,
        (Some(_), true) => MediaPlayback::Playing { progress },
        (Some(_), false) => MediaPlayback::Paused { progress },
    };
    if let Err(error) = controls.set_playback(playback) {
        log::warn!("更新播放状态失败: {error:?}");
    }
    *last = state.clone();
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn maps_system_events_to_player_commands() {
        assert_eq!(
            command_for(&MediaControlEvent::Toggle),
            Some(PlayerCommand::Toggle)
        );
        assert_eq!(
            command_for(&MediaControlEvent::Previous),
            Some(PlayerCommand::Prev)
        );
        assert_eq!(
            command_for(&MediaControlEvent::SetPosition(MediaPosition(
                Duration::from_secs(42)
            ))),
            Some(PlayerCommand::Seek { position: 42.0 })
        );
        assert_eq!(
            command_for(&MediaControlEvent::Seek(SeekDirection::Backward)),
            Some(PlayerCommand::SeekBy {
                delta: -DEFAULT_SEEK_STEP
            })
        );
        assert_eq!(
            command_for(&MediaControlEvent::SeekBy(
                SeekDirection::Forward,
                Duration::from_secs(10)
            )),
            Some(PlayerCommand::SeekBy { delta: 10.0 })
        );
        assert_eq!(command_for(&MediaControlEvent::Quit), None);
    }
}
