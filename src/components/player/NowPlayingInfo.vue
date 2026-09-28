<script setup lang="ts">
import { storeToRefs } from 'pinia'

import { useLyricStore } from '@/stores/lyric'
import { usePlayerStore } from '@/stores/player'
import { joinArtists, resizeImage } from '@/utils/format'

import LikeButton from './LikeButton.vue'

const { currentSong, trial } = storeToRefs(usePlayerStore())
const { visible: lyricVisible } = storeToRefs(useLyricStore())
</script>

<template>
  <div class="flex min-w-0 items-center gap-3">
    <button
      class="group relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-elevated text-muted"
      :title="lyricVisible ? '收起歌词' : '展开歌词'"
      :disabled="!currentSong"
      @click="lyricVisible = !lyricVisible"
    >
      <img
        v-if="currentSong?.album.picUrl"
        :src="resizeImage(currentSong.album.picUrl, 96)"
        :alt="currentSong.album.name"
        draggable="false"
        class="size-full object-cover"
      />
      <i-ri-music-2-line v-else class="text-xl" />
      <span
        v-if="currentSong"
        class="absolute inset-0 flex items-center justify-center bg-black/40 text-xl text-white opacity-0 transition-opacity group-hover:opacity-100"
      >
        <i-ri-arrow-down-s-line v-if="lyricVisible" />
        <i-ri-arrow-up-s-line v-else />
      </span>
    </button>
    <div class="min-w-0">
      <p class="flex items-center gap-1.5 text-sm">
        <span class="truncate">{{ currentSong?.name ?? '暂无播放' }}</span>
        <n-tag v-if="trial" size="tiny" type="warning" :bordered="false" class="shrink-0">
          试听
        </n-tag>
        <LikeButton v-if="currentSong" :song-id="currentSong.id" class="ml-1 text-base" />
      </p>
      <p class="truncate text-xs text-muted">
        {{ currentSong ? joinArtists(currentSong.artists) : 'Eliauk 音乐' }}
      </p>
    </div>
  </div>
</template>
