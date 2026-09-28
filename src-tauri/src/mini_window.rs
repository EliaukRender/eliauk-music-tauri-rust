use tauri::{
    AppHandle, LogicalSize, Manager, PhysicalPosition, WebviewUrl, WebviewWindow,
    WebviewWindowBuilder, WindowEvent,
};
use tauri_plugin_window_state::{StateFlags, WindowExt};

pub const MINI_WINDOW: &str = "mini";

/// 与前端 src/views/mini 的布局保持一致（逻辑像素）
pub const MINI_WIDTH: f64 = 340.0;
pub const MINI_COLLAPSED_HEIGHT: f64 = 96.0;
/// 首次出现时距主屏工作区右下角的边距（逻辑像素）
const EDGE_MARGIN: f64 = 24.0;

/// 与 tauri.windows.conf.json 中主窗口一致：同一进程的 WebView2 环境参数必须相同，否则创建失败
#[cfg(windows)]
const WEBVIEW2_ARGS: &str =
    "--disable-features=msWebOOUI,msPdfOOUI,msSmartScreenProtection,HardwareMediaKeyHandling";

fn build(app: &AppHandle) -> tauri::Result<WebviewWindow> {
    let builder =
        WebviewWindowBuilder::new(app, MINI_WINDOW, WebviewUrl::App("index.html#/mini".into()))
            .title("Eliauk 音乐 mini")
            .inner_size(MINI_WIDTH, MINI_COLLAPSED_HEIGHT)
            .resizable(false)
            .maximizable(false)
            .minimizable(false)
            .always_on_top(true)
            .skip_taskbar(true)
            .visible(false)
            .disable_drag_drop_handler();

    // 不用透明窗口（mac 需要私有 API）：mac 用 Overlay 标题栏 + 隐藏红绿灯得到系统圆角与阴影
    #[cfg(target_os = "macos")]
    let builder = builder
        .title_bar_style(tauri::TitleBarStyle::Overlay)
        .hidden_title(true)
        .visible_on_all_workspaces(true)
        .focused(false);

    #[cfg(windows)]
    let builder = builder
        .decorations(false)
        .shadow(true)
        .additional_browser_args(WEBVIEW2_ARGS);

    let window = builder.build()?;

    #[cfg(target_os = "macos")]
    crate::macos::hide_traffic_lights(&window)?;

    place_bottom_right(&window)?;
    // 只恢复位置：尺寸由折叠状态决定；插件会丢弃落在已拔出显示器上的位置
    if let Err(error) = window.restore_state(StateFlags::POSITION) {
        log::warn!("恢复 mini 窗口位置失败: {error}");
    }

    let handle = window.clone();
    window.on_window_event(move |event| {
        if let WindowEvent::CloseRequested { api, .. } = event {
            api.prevent_close();
            let _ = handle.hide();
        }
    });
    Ok(window)
}

fn place_bottom_right(window: &WebviewWindow) -> tauri::Result<()> {
    let Some(monitor) = window.primary_monitor()? else {
        return Ok(());
    };
    let scale = monitor.scale_factor();
    let area = monitor.work_area();
    let size = window.outer_size()?;
    let margin = (EDGE_MARGIN * scale) as i32;
    window.set_position(PhysicalPosition::new(
        area.position.x + area.size.width as i32 - size.width as i32 - margin,
        area.position.y + area.size.height as i32 - size.height as i32 - margin,
    ))
}

/// 懒创建；已存在时在显示与隐藏之间切换
pub fn toggle(app: &AppHandle) -> tauri::Result<()> {
    let window = match app.get_webview_window(MINI_WINDOW) {
        Some(window) => window,
        None => build(app)?,
    };
    if window.is_visible()? {
        window.hide()
    } else {
        // mac 上 set_focus 会把整个应用（包括主窗口）带到前台，只 show 不聚焦
        window.show()
    }
}

/// 必须是 async：Windows 上在同步 command 中创建窗口会死锁
#[tauri::command]
pub async fn toggle_mini_player(app: AppHandle) -> Result<(), String> {
    toggle(&app).map_err(|e| e.to_string())
}

/// 折叠/展开队列时调整高度，宽度固定
#[tauri::command]
pub fn resize_mini_player(app: AppHandle, height: f64) -> Result<(), String> {
    let Some(window) = app.get_webview_window(MINI_WINDOW) else {
        return Ok(());
    };
    window
        .set_size(LogicalSize::new(
            MINI_WIDTH,
            height.max(MINI_COLLAPSED_HEIGHT),
        ))
        .map_err(|e| e.to_string())
}
