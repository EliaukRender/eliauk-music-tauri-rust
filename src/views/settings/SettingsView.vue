<script setup lang="ts">
import { isDesktop } from '@/utils/platform'

import AboutSection from './components/AboutSection.vue'
import AccountSection from './components/AccountSection.vue'
import AppearanceSection from './components/AppearanceSection.vue'
import GlobalShortcutSection from './components/GlobalShortcutSection.vue'
import HotkeySection from './components/HotkeySection.vue'
import PlaybackSection from './components/PlaybackSection.vue'
import ServiceSection from './components/ServiceSection.vue'
import WindowSection from './components/WindowSection.vue'
</script>

<template>
  <div class="mx-auto max-w-3xl space-y-6">
    <h1 class="text-xl font-semibold">设置</h1>
    <AppearanceSection />
    <AccountSection />
    <PlaybackSection />
    <HotkeySection />
    <!-- 仅桌面端：全局快捷键与窗口行为依赖 Tauri -->
    <GlobalShortcutSection v-if="isDesktop" />
    <WindowSection v-if="isDesktop" />
    <ServiceSection />
    <AboutSection />
  </div>
</template>
