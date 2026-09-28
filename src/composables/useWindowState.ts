import { onScopeDispose } from 'vue'

import { onWindowStateChange } from '@/services/tauri/window'
import { useAppStore } from '@/stores/app'

export function useWindowState() {
  const app = useAppStore()
  let unlisten: (() => void) | undefined
  let disposed = false

  void onWindowStateChange((state) => {
    app.isMaximized = state.maximized
    app.isFullscreen = state.fullscreen
  }).then((fn) => {
    if (disposed) fn()
    else unlisten = fn
  })

  onScopeDispose(() => {
    disposed = true
    unlisten?.()
  })
}
