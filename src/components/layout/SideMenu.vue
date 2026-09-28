<script setup lang="ts">
import AppLogo from '@/components/common/AppLogo.vue'
import { sideMenuGroups } from '@/constants/menu'
import { isMacOS } from '@/utils/platform'
</script>

<template>
  <aside class="flex w-56 shrink-0 flex-col border-r border-line bg-surface">
    <!-- macOS 顶部留给红绿灯，Logo 下移一行 -->
    <div data-tauri-drag-region class="flex h-14 shrink-0 items-center px-5">
      <AppLogo v-if="!isMacOS" class="pointer-events-none" />
    </div>
    <AppLogo v-if="isMacOS" class="px-5 pb-3" />

    <nav class="flex-1 overflow-y-auto px-3 pb-4">
      <section v-for="group in sideMenuGroups" :key="group.title" class="mt-3">
        <h3 class="px-3 pb-1.5 text-xs text-muted">{{ group.title }}</h3>
        <RouterLink
          v-for="item in group.items"
          :key="item.name"
          v-slot="{ href, navigate, isActive }"
          :to="{ name: item.name }"
          custom
        >
          <a
            :href="href"
            class="flex h-9 items-center gap-2.5 rounded-lg px-3 text-sm transition-colors"
            :class="
              isActive
                ? 'bg-primary/10 font-medium text-primary'
                : 'text-fg hover:bg-black/4 dark:hover:bg-white/6'
            "
            @click="navigate"
          >
            <component :is="item.icon" class="text-[17px]" />
            {{ item.label }}
          </a>
        </RouterLink>
      </section>
    </nav>
  </aside>
</template>
