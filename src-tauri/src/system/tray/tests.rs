use super::*;

fn state(title: Option<&str>, artist: Option<&str>) -> PlayerSnapshot {
    PlayerSnapshot {
        title: title.map(Into::into),
        artist: artist.map(Into::into),
        ..Default::default()
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
fn toggle_label_follows_playing_state() {
    let playing = PlayerSnapshot {
        is_playing: true,
        ..Default::default()
    };
    assert_eq!(toggle_label(&playing), "暂停");
    assert_eq!(toggle_label(&PlayerSnapshot::default()), "播放");
}
