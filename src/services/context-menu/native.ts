import { LogicalPosition } from '@tauri-apps/api/dpi'
import {
  Menu,
  MenuItem,
  type MenuItemOptions,
  PredefinedMenuItem,
  Submenu,
} from '@tauri-apps/api/menu'

import type { MenuAction } from './types'

type NativeItem = MenuItem | Submenu | PredefinedMenuItem

let previous: Menu | null = null

async function toNative(items: MenuAction[]): Promise<NativeItem[]> {
  return Promise.all(
    items.map(async (item): Promise<NativeItem> => {
      if (item.type === 'separator') return PredefinedMenuItem.new({ item: 'Separator' })
      if (item.type === 'submenu') {
        return Submenu.new({ id: item.id, text: item.label, items: await toNative(item.items) })
      }
      const options: MenuItemOptions = {
        id: item.id,
        text: item.label,
        enabled: item.enabled ?? true,
        accelerator: item.accelerator,
        action: item.action,
      }
      return MenuItem.new(options)
    }),
  )
}

/** popup 在菜单显示后就返回，不能立刻 close；在下次弹出前释放上一个菜单的 Rust 侧资源 */
export async function popupNativeMenu(items: MenuAction[], x: number, y: number) {
  const menu = await Menu.new({ items: await toNative(items) })
  const last = previous
  previous = menu
  await menu.popup(new LogicalPosition(x, y))
  await last?.close()
}
