//! NCM API 服务接入。
//!
//! 形态由 cargo feature 在构建期决定：
//! - `embedded-api`：随应用启动内嵌 sidecar，baseUrl 由 Rust 端分配端口后下发
//! - 未启用：远程模式，前端使用 `VITE_API_BASE_URL`，Rust 端不参与

use serde::Serialize;

#[cfg(feature = "embedded-api")]
mod embedded;

#[cfg(feature = "embedded-api")]
pub use embedded::{init, shutdown};

#[derive(Debug, Clone, Copy, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum ApiMode {
    #[cfg_attr(not(feature = "embedded-api"), allow(dead_code))]
    Embedded,
    #[cfg_attr(feature = "embedded-api", allow(dead_code))]
    Remote,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ApiEndpoint {
    pub mode: ApiMode,
    /// 仅内嵌模式有值；远程模式由前端环境变量提供
    pub base_url: Option<String>,
}

#[cfg(feature = "embedded-api")]
#[tauri::command]
pub async fn get_api_endpoint(
    state: tauri::State<'_, embedded::ApiServerState>,
) -> Result<ApiEndpoint, String> {
    let base_url = state.wait_ready().await?;
    Ok(ApiEndpoint {
        mode: ApiMode::Embedded,
        base_url: Some(base_url),
    })
}

#[cfg(not(feature = "embedded-api"))]
#[tauri::command]
pub async fn get_api_endpoint() -> Result<ApiEndpoint, String> {
    Ok(ApiEndpoint {
        mode: ApiMode::Remote,
        base_url: None,
    })
}
