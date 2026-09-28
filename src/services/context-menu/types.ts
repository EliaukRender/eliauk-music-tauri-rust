export type MenuAction =
  | {
      type: 'item'
      id: string
      label: string
      enabled?: boolean
      accelerator?: string
      action: () => void
    }
  | { type: 'submenu'; id: string; label: string; items: MenuAction[] }
  | { type: 'separator' }

export const separator: MenuAction = { type: 'separator' }
