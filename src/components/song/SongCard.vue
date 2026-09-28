<script setup lang="ts">
import { storeToRefs } from 'pinia'

import { PlayStatus } from '@/constants/player'
import { useSongMenu } from '@/features/context-menus'
import { usePlayerStore } from '@/stores/player'
import type { Song } from '@/types/music'
import { joinArtists, resizeImage } from '@/utils/format'

const props = defineProps<{ song: Song; songs: Song[] }>()

const player = usePlayerStore()
const { currentId, status } = storeToRefs(player)
const songMenu = useSongMenu()

function play() {
  player.playSongs(props.songs, props.song.id)
}
</script>

<template>
  <div
    class="group flex h-16 items-center gap-3 rounded-lg px-2 hover:bg-black/4 dark:hover:bg-white/6"
    :class="{ 'opacity-40': song.unavailable }"
    @dblclick="play"
    @contextmenu="songMenu.open($event, song, songs)"
  >
    <button
      class="relative size-12 shrink-0 overflow-hidden rounded-md bg-elevated"
      :title="`播放 ${song.name}`"
      @click="play"
    >
      <img
        :src="resizeImage(song.album.picUrl, 96)"
        alt=""
        loading="lazy"
        draggable="false"
        class="size-full object-cover"
      />
      <span
        class="absolute inset-0 flex items-center justify-center bg-black/30 text-lg text-white opacity-0 transition-opacity group-hover:opacity-100"
        :class="{ 'opacity-100': song.id === currentId }"
      >
        <i-ri-volume-up-fill v-if="song.id === currentId && status === PlayStatus.Playing" />
        <i-ri-play-fill v-else />
      </span>
    </button>
    <div class="min-w-0 flex-1">
      <p class="truncate text-sm" :class="{ 'text-primary': song.id === currentId }">
        {{ song.name }}
      </p>
      <p class="truncate text-xs text-muted">{{ joinArtists(song.artists) }}</p>
    </div>
  </div>
</template>
