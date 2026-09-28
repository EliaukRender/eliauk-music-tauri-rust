<script setup lang="ts">
import NowPlayingInfo from '@/components/player/NowPlayingInfo.vue'
import PlayControls from '@/components/player/PlayControls.vue'
import ProgressBar from '@/components/player/ProgressBar.vue'
import QueueEntryButton from '@/components/player/QueueEntryButton.vue'
import VolumeControl from '@/components/player/VolumeControl.vue'
import SpectrumEntryButton from '@/components/spectrum/SpectrumEntryButton.vue'
import { toggleMiniPlayer } from '@/services/tauri/mini'
import { isDesktop } from '@/utils/platform'
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
      <button
        v-if="isDesktop"
        class="hover:text-fg"
        title="mini 播放器"
        @click="toggleMiniPlayer()"
      >
        <i-ri-picture-in-picture-2-line class="text-lg" />
      </button>
      <SpectrumEntryButton />
      <VolumeControl />
      <QueueEntryButton />
    </div>
  </footer>
</template>
