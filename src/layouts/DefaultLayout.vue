<script setup lang="ts">
import ContextMenuHost from '@/components/common/ContextMenuHost.vue'
import PlayerBar from '@/components/layout/PlayerBar.vue'
import SideMenu from '@/components/layout/SideMenu.vue'
import TitleBar from '@/components/layout/TitleBar.vue'
import PlayQueueDrawer from '@/components/player/PlayQueueDrawer.vue'
import PlaylistEditModal from '@/components/playlist/PlaylistEditModal.vue'
import LoginModal from '@/components/user/LoginModal.vue'
import { CONTENT_OVERLAY_ID } from '@/constants/layout'
import { useAppStore } from '@/stores/app'

const app = useAppStore()
</script>

<template>
  <div class="flex h-full flex-col">
    <div class="flex min-h-0 flex-1">
      <SideMenu />
      <div class="flex min-w-0 flex-1 flex-col">
        <TitleBar />
        <div :id="CONTENT_OVERLAY_ID" class="relative min-h-0 flex-1 overflow-hidden">
          <main class="h-full overflow-y-auto px-8 pb-8">
            <RouterView />
          </main>
        </div>
      </div>
    </div>
    <PlayerBar />
    <PlayQueueDrawer />
    <LoginModal v-model:show="app.loginModalVisible" />
    <PlaylistEditModal />
    <ContextMenuHost />
  </div>
</template>
