import './assets/styles/main.css'

import { createApp } from 'vue'

import App from './App.vue'
import { router } from './router'
import { pinia } from './stores'

// 生产环境屏蔽 WebView 默认菜单（检查元素、重新加载），输入框保留剪切/复制/粘贴
if (!import.meta.env.DEV) {
  window.addEventListener('contextmenu', (event) => {
    const target = event.target as HTMLElement | null
    if (target?.closest('input, textarea, [contenteditable="true"]')) return
    event.preventDefault()
  })
}

createApp(App).use(pinia).use(router).mount('#app')
