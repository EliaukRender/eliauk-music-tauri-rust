<script setup lang="ts">
import { storeToRefs } from 'pinia'

import { usePlayerStore } from '@/stores/player'
import { joinArtists, resizeImage } from '@/utils/format'

const { currentSong, trial } = storeToRefs(usePlayerStore())
</script>

<template>
  <div class="flex min-w-0 items-center gap-3">
    <div
      class="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-elevated text-muted"
    >
      <img
        v-if="currentSong?.album.picUrl"
        :src="resizeImage(currentSong.album.picUrl, 96)"
        :alt="currentSong.album.name"
        draggable="false"
        class="size-full object-cover"
      />
      <i-ri-music-2-line v-else class="text-xl" />
    </div>
    <div class="min-w-0">
      <p class="flex items-center gap-1.5 text-sm">
        <span class="truncate">{{ currentSong?.name ?? '暂无播放' }}</span>
        <n-tag v-if="trial" size="tiny" type="warning" :bordered="false" class="shrink-0">
          试听
        </n-tag>
      </p>
      <p class="truncate text-xs text-muted">
        {{ currentSong ? joinArtists(currentSong.artists) : 'Eliauk 音乐' }}
      </p>
    </div>
  </div>
</template>
