use tauri::image::Image;
use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::TrayIconBuilder;
#[cfg(not(target_os = "macos"))]
use tauri::tray::{MouseButton, MouseButtonState, TrayIconEvent};
use tauri::AppHandle;

use crate::window::show_main_window;

const TRAY_ID: &str = "main-tray";
const MENU_SHOW: &str = "tray-show";
const MENU_QUIT: &str = "tray-quit";

pub fn init(app: &AppHandle) -> tauri::Result<()> {
    let show = MenuItem::with_id(app, MENU_SHOW, "显示主界面", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, MENU_QUIT, "退出", true, None::<&str>)?;
    let separator = PredefinedMenuItem::separator(app)?;
    let menu = Menu::with_items(app, &[&show, &separator, &quit])?;

    let builder = TrayIconBuilder::with_id(TRAY_ID)
        .tooltip("Eliauk Music")
        .menu(&menu)
        .on_menu_event(|app, event| match event.id.as_ref() {
            MENU_SHOW => show_main_window(app),
            MENU_QUIT => app.exit(0),
            _ => {}
        });

    // macOS 菜单栏要求单色 template 图标以适配深浅色；Windows 托盘使用彩色图标并响应左键
    #[cfg(target_os = "macos")]
    let builder = builder
        .icon(Image::from_bytes(include_bytes!(
            "../icons/tray/tray-template@2x.png"
        ))?)
        .icon_as_template(true)
        .show_menu_on_left_click(true);

    #[cfg(not(target_os = "macos"))]
    let builder = builder
        .icon(Image::from_bytes(include_bytes!("../icons/tray/tray.png"))?)
        .show_menu_on_left_click(false)
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                show_main_window(tray.app_handle());
            }
        });

    builder.build(app)?;
    Ok(())
}
