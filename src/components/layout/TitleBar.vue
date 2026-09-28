<script setup lang="ts">
import { useRouter } from 'vue-router'

import UserEntry from '@/components/user/UserEntry.vue'
import { RouteName } from '@/constants/route'
import { useAppStore } from '@/stores/app'
import { isDesktop, isMacOS } from '@/utils/platform'

import WindowControls from './WindowControls.vue'

const router = useRouter()
const appStore = useAppStore()

function toggleTheme() {
  const isDark = document.documentElement.classList.contains('dark')
  appStore.themeMode = isDark ? 'light' : 'dark'
}
</script>

<template>
  <!-- 空白区域可拖拽窗口，双击最大化由 Tauri 原生处理 -->
  <header data-tauri-drag-region class="flex h-14 shrink-0 items-center gap-3 pl-5">
    <div class="flex items-center gap-1">
      <n-button quaternary circle size="small" title="后退" @click="router.back()">
        <template #icon><i-ri-arrow-left-s-line /></template>
      </n-button>
      <n-button quaternary circle size="small" title="前进" @click="router.forward()">
        <template #icon><i-ri-arrow-right-s-line /></template>
      </n-button>
    </div>

    <n-input round size="small" placeholder="搜索音乐、歌手、歌单" class="max-w-64" disabled>
      <template #prefix><i-ri-search-line class="text-muted" /></template>
    </n-input>

    <div data-tauri-drag-region class="h-full flex-1" />

    <div class="flex items-center gap-1" :class="{ 'pr-4': isMacOS || !isDesktop }">
      <UserEntry class="mr-2" />
      <n-button quaternary circle size="small" title="切换主题" @click="toggleTheme">
        <template #icon>
          <i-ri-moon-clear-line class="dark:hidden" />
          <i-ri-sun-line class="hidden dark:block" />
        </template>
      </n-button>
      <n-button
        quaternary
        circle
        size="small"
        title="设置"
        @click="router.push({ name: RouteName.Settings })"
      >
        <template #icon><i-ri-settings-3-line /></template>
      </n-button>
    </div>

    <!-- macOS 使用系统红绿灯（见 tauri.macos.conf.json），其余平台自绘 -->
    <WindowControls v-if="isDesktop && !isMacOS" />
  </header>
</template>
