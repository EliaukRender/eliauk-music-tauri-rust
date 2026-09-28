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
