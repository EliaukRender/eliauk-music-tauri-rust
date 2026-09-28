import { isTauri } from '@tauri-apps/api/core'
import { reactive } from 'vue'

import { popupNativeMenu } from '@/services/context-menu/native'
import type { MenuAction } from '@/services/context-menu/types'

/** 非 Tauri 环境（浏览器调试、e2e）的兜底菜单状态，由 ContextMenuHost 渲染 */
export const fallbackMenu = reactive({
  visible: false,
  x: 0,
  y: 0,
  items: [] as MenuAction[],
})

export function showContextMenu(event: MouseEvent, items: MenuAction[]) {
  event.preventDefault()
  event.stopPropagation()
  if (isTauri()) {
    popupNativeMenu(items, event.clientX, event.clientY).catch((error) =>
      console.warn('[context-menu] 原生菜单弹出失败', error),
    )
    return
  }
  Object.assign(fallbackMenu, { visible: true, x: event.clientX, y: event.clientY, items })
}
