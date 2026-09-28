import './assets/styles/main.css'

import { createApp } from 'vue'

import { WindowLabel } from './constants/events'
import { currentWindowLabel } from './services/tauri/mini'
import { pinia } from './stores'

// 生产环境屏蔽 WebView 默认菜单（检查元素、重新加载），输入框保留剪切/复制/粘贴
if (!import.meta.env.DEV) {
  window.addEventListener('contextmenu', (event) => {
    const target = event.target as HTMLElement | null
    if (target?.closest('input, textarea, [contenteditable="true"]')) return
    event.preventDefault()
  })
}

/** 浏览器调试 mini 界面时可以用 ?window=mini 模拟 */
function resolveWindowLabel() {
  if (import.meta.env.DEV) {
    const simulated = new URLSearchParams(location.search).get('window')
    if (simulated) return simulated
  }
  return currentWindowLabel()
}

// mini 窗口不加载主界面、路由与播放器（音频只存在于主窗口）
async function bootstrap() {
  if (resolveWindowLabel() === WindowLabel.Mini) {
    const { default: MiniApp } = await import('./MiniApp.vue')
    createApp(MiniApp).use(pinia).mount('#app')
    return
  }
  const [{ default: App }, { router }] = await Promise.all([
    import('./App.vue'),
    import('./router'),
  ])
  createApp(App).use(pinia).use(router).mount('#app')
}

void bootstrap()
