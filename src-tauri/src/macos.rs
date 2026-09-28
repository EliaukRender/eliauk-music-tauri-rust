//! 需要直接调用 AppKit 的少量代码，集中在这里审查
#![allow(unsafe_code)]

use objc2_app_kit::{NSWindow, NSWindowButton};
use tauri::WebviewWindow;

/// Tauri 没有暴露隐藏标题栏按钮的接口；保留 Overlay 标题栏才能得到系统圆角和阴影
pub fn hide_traffic_lights(window: &WebviewWindow) -> tauri::Result<()> {
    let target = window.clone();
    window.run_on_main_thread(move || {
        let Ok(ptr) = target.ns_window() else {
            return;
        };
        // SAFETY: ns_window 在窗口存活期间指向有效的 NSWindow（闭包持有 target 保证存活），
        // 且 AppKit 调用在主线程执行
        let ns_window: &NSWindow = unsafe { &*ptr.cast() };
        for button in [
            NSWindowButton::CloseButton,
            NSWindowButton::MiniaturizeButton,
            NSWindowButton::ZoomButton,
        ] {
            if let Some(view) = ns_window.standardWindowButton(button) {
                view.setHidden(true);
            }
        }
    })
}
