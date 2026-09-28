import { storeToRefs } from 'pinia'
import { watch } from 'vue'

import type { GlobalAction } from '@/constants/hotkeys'
import { notify } from '@/services/notify'
import { setGlobalShortcuts } from '@/services/tauri/shortcuts'
import { useSettingsStore } from '@/stores/settings'
import { formatAccelerator } from '@/utils/hotkey'
import { usesCommandKey } from '@/utils/platform'

/** Rust 端不持久化，启动和设置变更时整体下发；只在主窗口挂载，避免重复注册 */
export function useGlobalShortcutsSync() {
  const { globalShortcutsEnabled, globalShortcuts } = storeToRefs(useSettingsStore())

  watch(
    [globalShortcutsEnabled, globalShortcuts],
    async ([enabled, shortcuts]) => {
      const bindings = enabled
        ? Object.entries(shortcuts)
            .filter(([, accelerator]) => accelerator)
            .map(([action, accelerator]) => ({ action: action as GlobalAction, accelerator }))
        : []
      try {
        const failures = await setGlobalShortcuts(bindings)
        if (failures.length) {
          const keys = failures.map((f) => formatAccelerator(f.accelerator, usesCommandKey))
          notify.warning(`全局快捷键 ${keys.join('、')} 注册失败，可能已被其他应用占用`)
        }
      } catch (error) {
        notify.error(`全局快捷键设置失败：${(error as Error).message}`)
      }
    },
    { immediate: true, deep: true },
  )
}
