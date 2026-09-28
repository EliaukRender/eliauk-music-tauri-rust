import type { MessageApi } from 'naive-ui'

let messageApi: MessageApi | null = null

/** naive-ui 的 useMessage 只能在组件内调用，由 MessageBridge 注入后供 store 等非组件代码使用 */
export function bindMessageApi(api: MessageApi | null) {
  messageApi = api
}

export const notify = {
  info: (content: string) => messageApi?.info(content),
  success: (content: string) => messageApi?.success(content),
  warning: (content: string) => messageApi?.warning(content),
  error: (content: string) => messageApi?.error(content),
}
