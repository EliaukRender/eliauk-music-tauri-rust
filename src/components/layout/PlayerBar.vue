<script setup lang="ts">
import NowPlayingInfo from '@/components/player/NowPlayingInfo.vue'
import PlayControls from '@/components/player/PlayControls.vue'
import ProgressBar from '@/components/player/ProgressBar.vue'
import VolumeControl from '@/components/player/VolumeControl.vue'
</script>

<template>
  <footer
    class="grid h-[72px] shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-6 border-t border-line bg-surface px-5"
  >
    <NowPlayingInfo />

    <div class="flex w-[440px] flex-col items-center gap-0.5">
      <PlayControls />
      <ProgressBar />
    </div>

    <div class="flex items-center justify-end gap-4 text-muted">
      <VolumeControl />
    </div>
  </footer>
</template>
