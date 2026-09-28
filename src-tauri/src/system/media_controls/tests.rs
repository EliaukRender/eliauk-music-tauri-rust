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
