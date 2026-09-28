import { storeToRefs } from 'pinia'
import { watch } from 'vue'

import { syncCloseBehavior } from '@/services/tauri/window'
import { useSettingsStore } from '@/stores/settings'

/** Rust 端不持久化窗口设置，每次启动及变更时由前端下发 */
export function useWindowSettingsSync() {
  const { closeBehavior } = storeToRefs(useSettingsStore())
  watch(closeBehavior, (value) => void syncCloseBehavior(value), { immediate: true })
}
