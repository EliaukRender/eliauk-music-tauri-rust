use super::*;

#[test]
fn close_behavior_defaults_to_minimize() {
    assert_eq!(
        WindowSettings::default().close_behavior(),
        CloseBehavior::Minimize
    );
}

#[test]
fn close_behavior_deserializes_from_frontend_values() {
    let parsed: CloseBehavior = serde_json::from_str("\"exit\"").unwrap();
    assert_eq!(parsed, CloseBehavior::Exit);
    let parsed: CloseBehavior = serde_json::from_str("\"minimize\"").unwrap();
    assert_eq!(parsed, CloseBehavior::Minimize);
}
