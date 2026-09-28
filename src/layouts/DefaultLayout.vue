<script setup lang="ts">
import { useTemplateRef } from 'vue'

import ContextMenuHost from '@/components/common/ContextMenuHost.vue'
import PlayerBar from '@/components/layout/PlayerBar.vue'
import SideMenu from '@/components/layout/SideMenu.vue'
import TitleBar from '@/components/layout/TitleBar.vue'
import PlayQueueDrawer from '@/components/player/PlayQueueDrawer.vue'
import PlaylistEditModal from '@/components/playlist/PlaylistEditModal.vue'
import LoginModal from '@/components/user/LoginModal.vue'
import { useGlobalShortcutsSync } from '@/composables/useGlobalShortcutsSync'
import { useHotkeys } from '@/composables/useHotkeys'
import { useMiniBridge } from '@/composables/useMiniBridge'
import { useScrollRestore } from '@/composables/useScrollRestore'
import { useSystemBridge } from '@/composables/useSystemBridge'
import { useWindowState } from '@/composables/useWindowState'
import { CONTENT_OVERLAY_ID } from '@/constants/layout'
import { useAppStore } from '@/stores/app'
import LyricView from '@/views/lyric/LyricView.vue'

const app = useAppStore()
useWindowState()
useHotkeys()
useSystemBridge()
useGlobalShortcutsSync()
useMiniBridge()

/** 列表类页面切换时保留状态，避免重复请求（组件需要声明 name） */
const KEEP_ALIVE_VIEWS = ['DiscoverView', 'ToplistView', 'ArtistsView']
useScrollRestore(useTemplateRef<HTMLElement>('main'))
</script>

<template>
  <div class="relative flex h-full flex-col">
    <div class="flex min-h-0 flex-1">
      <SideMenu />
      <div class="flex min-w-0 flex-1 flex-col">
        <TitleBar />
        <div :id="CONTENT_OVERLAY_ID" class="relative min-h-0 flex-1 overflow-hidden">
          <main ref="main" class="h-full overflow-y-auto px-8 pb-8">
            <RouterView v-slot="{ Component }">
              <KeepAlive :include="KEEP_ALIVE_VIEWS">
                <component :is="Component" />
              </KeepAlive>
            </RouterView>
          </main>
        </div>
      </div>
    </div>
    <LyricView />
    <PlayerBar />
    <PlayQueueDrawer />
    <LoginModal v-model:show="app.loginModalVisible" />
    <PlaylistEditModal />
    <ContextMenuHost />
  </div>
</template>
