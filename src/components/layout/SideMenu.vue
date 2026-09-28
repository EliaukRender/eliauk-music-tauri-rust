<script setup lang="ts">
import { storeToRefs } from 'pinia'

import AppLogo from '@/components/common/AppLogo.vue'
import PlaylistMenuItem from '@/components/playlist/PlaylistMenuItem.vue'
import { usePlaylistActions } from '@/composables/usePlaylistActions'
import { sideMenuGroups } from '@/constants/menu'
import { RouteName } from '@/constants/route'
import { useAppStore } from '@/stores/app'
import { usePlaylistStore } from '@/stores/playlist'
import { useUserStore } from '@/stores/user'
import { isMacOS } from '@/utils/platform'

const app = useAppStore()
const { isLoggedIn } = storeToRefs(useUserStore())
const { likedPlaylist, created, subscribed, mineLoading } = storeToRefs(usePlaylistStore())
const { openCreate } = usePlaylistActions()

const itemClass = (active: boolean) =>
  active
    ? 'bg-primary/10 font-medium text-primary'
    : 'text-fg hover:bg-black/4 dark:hover:bg-white/6'
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
            draggable="false"
            class="flex h-9 items-center gap-2.5 rounded-lg px-3 text-sm transition-colors"
            :class="itemClass(isActive)"
            @click="navigate"
          >
            <component :is="item.icon" class="text-[17px]" />
            {{ item.label }}
          </a>
        </RouterLink>
      </section>

      <section class="mt-3">
        <h3 class="px-3 pb-1.5 text-xs text-muted">我的音乐</h3>
        <RouterLink
          v-if="isLoggedIn && likedPlaylist"
          v-slot="{ href, navigate, isActive }"
          :to="{ name: RouteName.Playlist, params: { id: likedPlaylist.id } }"
          custom
        >
          <a
            :href="href"
            draggable="false"
            class="flex h-9 items-center gap-2.5 rounded-lg px-3 text-sm transition-colors"
            :class="itemClass(isActive)"
            @click="navigate"
          >
            <i-ri-heart-3-line class="text-[17px]" />
            我喜欢的音乐
          </a>
        </RouterLink>
        <button
          v-else-if="!isLoggedIn"
          class="flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-sm"
          :class="itemClass(false)"
          @click="app.loginModalVisible = true"
        >
          <i-ri-heart-3-line class="text-[17px]" />
          我喜欢的音乐
        </button>
      </section>

      <template v-if="isLoggedIn">
        <section class="mt-3">
          <h3 class="flex items-center justify-between px-3 pb-1.5 text-xs text-muted">
            创建的歌单
            <button class="hover:text-fg" title="新建歌单" @click="openCreate">
              <i-ri-add-line class="text-sm" />
            </button>
          </h3>
          <n-skeleton v-if="mineLoading && !created.length" text :repeat="3" class="px-3" />
          <PlaylistMenuItem v-for="item in created" :key="item.id" :playlist="item" />
        </section>

        <section v-if="subscribed.length" class="mt-3">
          <h3 class="px-3 pb-1.5 text-xs text-muted">收藏的歌单</h3>
          <PlaylistMenuItem v-for="item in subscribed" :key="item.id" :playlist="item" />
        </section>
      </template>

      <div
        v-else
        class="mx-3 mt-4 rounded-lg bg-elevated px-3 py-3 text-xs leading-relaxed text-muted"
      >
        登录后查看你创建和收藏的歌单
        <n-button
          size="tiny"
          type="primary"
          secondary
          class="mt-2 w-full"
          @click="app.loginModalVisible = true"
        >
          扫码登录
        </n-button>
      </div>
    </nav>
  </aside>
</template>
