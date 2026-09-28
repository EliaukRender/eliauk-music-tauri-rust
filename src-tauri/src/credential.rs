//! 登录凭据存放在系统凭据库：macOS 钥匙串、Windows 凭据管理器

use keyring::{Entry, Error as KeyringError};

const SERVICE: &str = "com.eliauk.music";
const ACCOUNT: &str = "netease-cookie";

fn entry() -> Result<Entry, String> {
    Entry::new(SERVICE, ACCOUNT).map_err(|e| e.to_string())
}

/// 钥匙串访问可能弹出系统授权框并阻塞调用线程，放到阻塞线程池执行，避免卡住主线程
async fn run_blocking<T, F>(task: F) -> Result<T, String>
where
    T: Send + 'static,
    F: FnOnce() -> Result<T, String> + Send + 'static,
{
    tauri::async_runtime::spawn_blocking(task)
        .await
        .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn load_credential() -> Result<Option<String>, String> {
    run_blocking(|| match entry()?.get_password() {
        Ok(value) => Ok(Some(value)),
        Err(KeyringError::NoEntry) => Ok(None),
        Err(error) => Err(error.to_string()),
    })
    .await
}

#[tauri::command]
pub async fn save_credential(value: String) -> Result<(), String> {
    run_blocking(move || entry()?.set_password(&value).map_err(|e| e.to_string())).await
}

#[tauri::command]
pub async fn clear_credential() -> Result<(), String> {
    run_blocking(|| match entry()?.delete_credential() {
        Ok(()) | Err(KeyringError::NoEntry) => Ok(()),
        Err(error) => Err(error.to_string()),
    })
    .await
}
