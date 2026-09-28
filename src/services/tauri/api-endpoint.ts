import { invoke, isTauri } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'

export type ApiMode = 'embedded' | 'remote'

export type ApiEndpoint = {
  mode: ApiMode
  baseUrl: string
}

type RustApiEndpoint = {
  mode: ApiMode
  baseUrl: string | null
}

/** 与 src-tauri/src/api_server/embedded.rs 中的 ENDPOINT_CHANGED_EVENT 保持一致 */
const ENDPOINT_CHANGED_EVENT = 'api://endpoint-changed'

let pending: Promise<ApiEndpoint> | null = null

function remoteEndpoint(): ApiEndpoint {
  const baseUrl = import.meta.env.VITE_API_BASE_URL?.trim()
  if (!baseUrl) throw new Error('远程 API 模式未配置 VITE_API_BASE_URL')
  return { mode: 'remote', baseUrl }
}

async function fetchEndpoint(): Promise<ApiEndpoint> {
  // 浏览器调试（pnpm dev:web）没有 Rust 端，按远程模式处理
  if (!isTauri()) return remoteEndpoint()
  const endpoint = await invoke<RustApiEndpoint>('get_api_endpoint')
  if (endpoint.mode === 'remote') return remoteEndpoint()
  return { mode: 'embedded', baseUrl: endpoint.baseUrl! }
}

/** 获取 API 地址。内嵌模式会等待 sidecar 就绪；失败后下次调用会重试 */
export function resolveApiEndpoint(): Promise<ApiEndpoint> {
  pending ??= fetchEndpoint().catch((error) => {
    pending = null
    throw error
  })
  return pending
}

if (isTauri()) {
  // sidecar 异常重启后端口会变化
  void listen<string>(ENDPOINT_CHANGED_EVENT, ({ payload }) => {
    pending = Promise.resolve({ mode: 'embedded', baseUrl: payload })
  })
}
