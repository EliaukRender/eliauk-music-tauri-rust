//! 与前端 src/constants/events.ts 保持一致

use serde::Serialize;

/// 托盘、全局快捷键、mini 窗口发给主窗口的播放指令
pub const PLAYER_COMMAND: &str = "player://command";

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(tag = "type", rename_all = "kebab-case")]
pub enum PlayerCommand {
    Toggle,
    Prev,
    Next,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn serializes_with_type_tag() {
        let json = serde_json::to_string(&PlayerCommand::Toggle).unwrap();
        assert_eq!(json, r#"{"type":"toggle"}"#);
        let json = serde_json::to_string(&PlayerCommand::Next).unwrap();
        assert_eq!(json, r#"{"type":"next"}"#);
    }
}
