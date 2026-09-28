//! 与前端 src/constants/events.ts 保持一致

use serde::Serialize;

/// 托盘、全局快捷键、系统媒体中心、mini 窗口发给主窗口的播放指令
pub const PLAYER_COMMAND: &str = "player://command";

#[derive(Debug, Clone, Copy, PartialEq, Serialize)]
#[serde(tag = "type", rename_all = "kebab-case")]
pub enum PlayerCommand {
    Toggle,
    Play,
    Pause,
    Prev,
    Next,
    /// 跳到指定位置（秒）
    Seek {
        position: f64,
    },
    /// 相对当前位置偏移（秒），负数为后退
    SeekBy {
        delta: f64,
    },
}

#[cfg(test)]
mod tests;
