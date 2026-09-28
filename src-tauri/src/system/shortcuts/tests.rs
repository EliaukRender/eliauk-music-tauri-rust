use super::*;

#[test]
fn deserializes_bindings_from_frontend() {
    let bindings: Vec<ShortcutBinding> = serde_json::from_str(
        r#"[{"action":"toggle-play","accelerator":"CommandOrControl+Alt+Space"}]"#,
    )
    .unwrap();
    assert_eq!(bindings[0].action, GlobalAction::TogglePlay);
    assert_eq!(bindings[0].action.command(), Some(PlayerCommand::Toggle));
    let mini: GlobalAction = serde_json::from_str(r#""toggle-mini""#).unwrap();
    assert_eq!(mini.command(), None);
}

#[test]
fn parses_default_accelerators() {
    for accelerator in [
        "CommandOrControl+Alt+Space",
        "CommandOrControl+Alt+Left",
        "CommandOrControl+Alt+Right",
        "CommandOrControl+Alt+M",
    ] {
        assert!(accelerator.parse::<Shortcut>().is_ok(), "{accelerator}");
    }
}
