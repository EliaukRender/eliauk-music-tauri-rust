//! 内嵌 sidecar 生命周期管理：分配端口 → 拉起 → 等待就绪信号 → 异常退出重启 → 应用退出时回收。
//!
//! 与 sidecar 的 stdout 协议见 `sidecar/ncm-api/src/index.cjs`。

use std::net::TcpListener;
use std::sync::atomic::{AtomicBool, AtomicU32, Ordering};
use std::sync::Mutex;
use std::time::Duration;

use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_shell::process::{CommandChild, CommandEvent};
use tauri_plugin_shell::ShellExt;
use tokio::sync::watch;

const SIDECAR_NAME: &str = "ncm-api";
const READY_SIGNAL: &str = "NCM_API_READY";
const ERROR_SIGNAL: &str = "NCM_API_ERROR";
const HOST: &str = "127.0.0.1";
/// 重启后端口会变化，前端据此刷新 baseURL
const ENDPOINT_CHANGED_EVENT: &str = "api://endpoint-changed";
const MAX_RESTARTS: u32 = 3;
// 首次启动包含匿名 token 注册（sidecar 内部最多等 5s），留足余量
const READY_TIMEOUT: Duration = Duration::from_secs(20);

#[derive(Debug, Clone)]
enum ServerStatus {
    Starting,
    Ready(u16),
    Failed(String),
}

pub struct ApiServerState {
    status: watch::Sender<ServerStatus>,
    child: Mutex<Option<CommandChild>>,
    restarts: AtomicU32,
    shutting_down: AtomicBool,
}

impl ApiServerState {
    fn new() -> Self {
        let (status, _) = watch::channel(ServerStatus::Starting);
        Self {
            status,
            child: Mutex::new(None),
            restarts: AtomicU32::new(0),
            shutting_down: AtomicBool::new(false),
        }
    }

    pub async fn wait_ready(&self) -> Result<String, String> {
        let mut rx = self.status.subscribe();
        let waited = tokio::time::timeout(
            READY_TIMEOUT,
            rx.wait_for(|s| !matches!(s, ServerStatus::Starting)),
        )
        .await
        .map_err(|_| "NCM API 服务启动超时".to_string())?
        .map_err(|e| e.to_string())?;

        match &*waited {
            ServerStatus::Ready(port) => Ok(format!("http://{HOST}:{port}")),
            ServerStatus::Failed(reason) => Err(format!("NCM API 服务启动失败: {reason}")),
            ServerStatus::Starting => unreachable!(),
        }
    }
}

pub fn init(app: &AppHandle) {
    app.manage(ApiServerState::new());
    spawn_server(app.clone());
}

pub fn shutdown(app: &AppHandle) {
    let state = app.state::<ApiServerState>();
    state.shutting_down.store(true, Ordering::SeqCst);
    let child = state.child.lock().unwrap().take();
    if let Some(child) = child {
        if let Err(e) = child.kill() {
            log::warn!("结束 NCM API 进程失败: {e}");
        }
    }
}

fn pick_free_port() -> std::io::Result<u16> {
    // 端口在 drop 后才交给 sidecar，存在极小竞争窗口；失败会走重启逻辑换端口
    Ok(TcpListener::bind((HOST, 0))?.local_addr()?.port())
}

fn spawn_server(app: AppHandle) {
    let (mut events, port) = match start_process(&app) {
        Ok(started) => started,
        Err(reason) => {
            log::error!("{reason}");
            let state = app.state::<ApiServerState>();
            state.status.send_replace(ServerStatus::Failed(reason));
            return;
        }
    };

    tauri::async_runtime::spawn(async move {
        let state = app.state::<ApiServerState>();
        while let Some(event) = events.recv().await {
            match event {
                CommandEvent::Stdout(bytes) => {
                    let line = String::from_utf8_lossy(&bytes);
                    let line = line.trim_end();
                    if line.starts_with(READY_SIGNAL) {
                        log::info!("NCM API 就绪: http://{HOST}:{port}");
                        state.restarts.store(0, Ordering::SeqCst);
                        state.status.send_replace(ServerStatus::Ready(port));
                        let _ = app.emit(ENDPOINT_CHANGED_EVENT, format!("http://{HOST}:{port}"));
                    } else if let Some(reason) = line.strip_prefix(ERROR_SIGNAL) {
                        log::error!("NCM API 报告错误:{reason}");
                    } else {
                        log::debug!(target: "ncm-api", "{line}");
                    }
                }
                CommandEvent::Stderr(bytes) => {
                    log::warn!(target: "ncm-api", "{}", String::from_utf8_lossy(&bytes).trim_end());
                }
                CommandEvent::Terminated(payload) => {
                    state.child.lock().unwrap().take();
                    if state.shutting_down.load(Ordering::SeqCst) {
                        break;
                    }
                    let attempt = state.restarts.fetch_add(1, Ordering::SeqCst) + 1;
                    log::warn!(
                        "NCM API 进程退出 (code={:?})，第 {attempt} 次重启",
                        payload.code
                    );
                    if attempt > MAX_RESTARTS {
                        state.status.send_replace(ServerStatus::Failed(format!(
                            "进程多次异常退出 (code={:?})",
                            payload.code
                        )));
                        break;
                    }
                    state.status.send_replace(ServerStatus::Starting);
                    tokio::time::sleep(Duration::from_secs(1)).await;
                    spawn_server(app.clone());
                    break;
                }
                _ => {}
            }
        }
    });
}

type ProcessEvents = tauri::async_runtime::Receiver<CommandEvent>;

fn start_process(app: &AppHandle) -> Result<(ProcessEvents, u16), String> {
    let port = pick_free_port().map_err(|e| format!("分配端口失败: {e}"))?;
    let command = app
        .shell()
        .sidecar(SIDECAR_NAME)
        .map_err(|e| format!("未找到 sidecar 可执行文件: {e}"))?
        .args([
            format!("--port={port}"),
            format!("--host={HOST}"),
            format!("--parent-pid={}", std::process::id()),
        ]);
    let (events, child) = command
        .spawn()
        .map_err(|e| format!("启动 sidecar 失败: {e}"))?;
    log::info!("NCM API sidecar 已启动 (pid={}, port={port})", child.pid());
    *app.state::<ApiServerState>().child.lock().unwrap() = Some(child);
    Ok((events, port))
}
