use serde::Deserialize;
use tauri::AppHandle;

use crate::{media_controls, tray};

/// 前端推送的播放状态，见 src/services/tauri/system-bridge.ts
#[derive(Debug, Clone, Default, PartialEq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PlayerSnapshot {
    pub title: Option<String>,
    pub artist: Option<String>,
    pub album: Option<String>,
    pub cover_url: Option<String>,
    /// 秒
    pub duration: f64,
    /// 秒，系统媒体中心据此外推进度
    pub position: f64,
    pub is_playing: bool,
}

/// 歌曲、播放状态或进度跳变时由前端调用，同步到托盘与系统媒体中心
#[tauri::command]
pub fn sync_player_state(app: AppHandle, state: PlayerSnapshot) -> Result<(), String> {
    tray::update(&app, &state)?;
    media_controls::update(&app, &state);
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn deserializes_frontend_payload() {
        let parsed: PlayerSnapshot = serde_json::from_str(
            r#"{"title":"a","artist":null,"album":"b","coverUrl":"https://x","duration":180.5,"position":3,"isPlaying":true}"#,
        )
        .unwrap();
        assert!(parsed.is_playing);
        assert_eq!(parsed.cover_url.as_deref(), Some("https://x"));
        assert_eq!(parsed.position, 3.0);
    }
}
