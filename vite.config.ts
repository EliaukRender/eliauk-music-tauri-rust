/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import IconsResolver from 'unplugin-icons/resolver'
import Icons from 'unplugin-icons/vite'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'

const host = process.env.TAURI_ENV_HOST
const isDebug = !!process.env.TAURI_ENV_DEBUG

// https://v2.tauri.app/start/frontend/vite/
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    Components({
      dts: 'src/types/components.d.ts',
      // 图标组件用法：<i-ri-play-fill />，构建期内联 SVG，离线可用
      resolvers: [NaiveUiResolver(), IconsResolver({ prefix: 'i', enabledCollections: ['ri'] })],
    }),
    Icons({ compiler: 'vue3', autoInstall: false }),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  envPrefix: ['VITE_', 'TAURI_ENV_'],
  // Tauri 需要固定端口且不应清屏覆盖 Rust 编译输出
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host ? { protocol: 'ws', host, port: 1421 } : undefined,
    watch: { ignored: ['**/src-tauri/**', '**/sidecar/**'] },
  },
  build: {
    // WebView2(Chromium) 与 WKWebView(macOS 10.15 = Safari 13) 的最低公共能力
    target: process.env.TAURI_ENV_PLATFORM === 'windows' ? 'chrome105' : 'safari13',
    minify: isDebug ? false : 'oxc',
    sourcemap: isDebug,
  },
  test: {
    environment: 'happy-dom',
    include: ['tests/unit/**/*.test.ts'],
    restoreMocks: true,
    unstubEnvs: true,
  },
})
