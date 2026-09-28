<script setup lang="ts">
import { storeToRefs } from 'pinia'

import { usePlayerStore } from '@/stores/player'

const { currentSong, isPlaying, volume } = storeToRefs(usePlayerStore())
</script>

<template>
  <!-- 播放控制骨架：交互接入见 docs/功能方案/02-播放核心.md -->
  <footer
    class="grid h-[72px] shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-6 border-t border-line bg-surface px-5"
  >
    <div class="flex min-w-0 items-center gap-3">
      <div
        class="flex size-12 shrink-0 items-center justify-center rounded-lg bg-elevated text-muted"
      >
        <i-ri-music-2-line class="text-xl" />
      </div>
      <div class="min-w-0">
        <p class="truncate text-sm">{{ currentSong?.name ?? '暂无播放' }}</p>
        <p class="truncate text-xs text-muted">
          {{ currentSong?.artists.map((a) => a.name).join(' / ') ?? 'Eliauk 音乐' }}
        </p>
      </div>
    </div>

    <div class="flex w-[420px] flex-col items-center gap-1">
      <div class="flex items-center gap-4 text-xl">
        <button class="text-muted hover:text-fg" title="上一首"><i-ri-skip-back-fill /></button>
        <button
          class="flex size-9 items-center justify-center rounded-full bg-primary text-white hover:bg-primary-hover"
          :title="isPlaying ? '暂停' : '播放'"
        >
          <i-ri-pause-fill v-if="isPlaying" />
          <i-ri-play-fill v-else />
        </button>
        <button class="text-muted hover:text-fg" title="下一首"><i-ri-skip-forward-fill /></button>
      </div>
      <n-slider :value="0" :tooltip="false" disabled class="w-full" />
    </div>

    <div class="flex items-center justify-end gap-2 text-muted">
      <i-ri-volume-up-line class="text-lg" />
      <n-slider v-model:value="volume" :tooltip="false" class="w-24!" />
      <button class="ml-2 hover:text-fg" title="播放列表">
        <i-ri-play-list-line class="text-lg" />
      </button>
    </div>
  </footer>
</template>
