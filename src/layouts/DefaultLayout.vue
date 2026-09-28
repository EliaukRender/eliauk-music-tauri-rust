<script setup lang="ts">
import PlayerBar from '@/components/layout/PlayerBar.vue'
import SideMenu from '@/components/layout/SideMenu.vue'
import TitleBar from '@/components/layout/TitleBar.vue'
</script>

<template>
  <div class="flex h-full flex-col">
    <div class="flex min-h-0 flex-1">
      <SideMenu />
      <div class="flex min-w-0 flex-1 flex-col">
        <TitleBar />
        <main class="min-h-0 flex-1 overflow-y-auto px-8 pb-8">
          <RouterView />
        </main>
      </div>
    </div>
    <PlayerBar />
  </div>
</template>
