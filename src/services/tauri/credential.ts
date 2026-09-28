import { invoke, isTauri } from '@tauri-apps/api/core'

/** 浏览器调试时没有系统凭据库，退化为 localStorage（明文，仅开发用） */
const DEV_STORAGE_KEY = 'eliauk:dev-credential'

export async function loadCredential(): Promise<string | null> {
  if (!isTauri()) return localStorage.getItem(DEV_STORAGE_KEY)
  return invoke<string | null>('load_credential')
}

export async function saveCredential(value: string) {
  if (!isTauri()) return localStorage.setItem(DEV_STORAGE_KEY, value)
  await invoke('save_credential', { value })
}

export async function clearCredential() {
  if (!isTauri()) return localStorage.removeItem(DEV_STORAGE_KEY)
  await invoke('clear_credential')
}
