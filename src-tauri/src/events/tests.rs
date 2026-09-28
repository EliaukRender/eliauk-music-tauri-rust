use super::*;

#[test]
fn serializes_with_type_tag() {
    let json = serde_json::to_string(&PlayerCommand::Toggle).unwrap();
    assert_eq!(json, r#"{"type":"toggle"}"#);
    let json = serde_json::to_string(&PlayerCommand::SeekBy { delta: -5.0 }).unwrap();
    assert_eq!(json, r#"{"type":"seek-by","delta":-5.0}"#);
}
