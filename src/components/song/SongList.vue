<script setup lang="ts">
import { storeToRefs } from 'pinia'

import LikeButton from '@/components/player/LikeButton.vue'
import { PlayStatus } from '@/constants/player'
import { useSongMenu } from '@/features/context-menus'
import { usePlayerStore } from '@/stores/player'
import type { Song } from '@/types/music'
import { formatDuration, joinArtists } from '@/utils/format'

const props = withDefaults(
  defineProps<{
    songs: Song[]
    loading?: boolean
    /** 所在歌单，用于右键菜单判断能否移除 */
    playlistId?: number
  }>(),
  { loading: false, playlistId: undefined },
)

const player = usePlayerStore()
const { currentId, status } = storeToRefs(player)
const songMenu = useSongMenu()

function play(song: Song) {
  player.playSongs(props.songs, song.id)
}
</script>

<template>
  <div class="text-sm">
    <div
      class="grid h-9 grid-cols-[48px_20px_minmax(0,5fr)_minmax(0,3fr)_minmax(0,3fr)_56px] items-center gap-3 px-3 text-xs text-muted"
    >
      <span class="text-center">#</span>
      <span />
      <span>标题</span>
      <span>歌手</span>
      <span>专辑</span>
      <span class="text-right">时长</span>
    </div>

    <template v-if="loading">
      <n-skeleton v-for="n in 8" :key="n" height="40px" class="mb-1 rounded-lg" />
    </template>

    <n-empty v-else-if="!songs.length" description="暂无歌曲" class="py-16" />

    <div
      v-for="(song, index) in songs"
      v-else
      :key="song.id"
      class="song-row grid h-10 cursor-default grid-cols-[48px_20px_minmax(0,5fr)_minmax(0,3fr)_minmax(0,3fr)_56px] items-center gap-3 rounded-lg px-3 hover:bg-black/4 dark:hover:bg-white/6"
      :class="{
        'text-primary': song.id === currentId,
        'opacity-40': song.unavailable,
        'odd:bg-black/2 dark:odd:bg-white/2': song.id !== currentId,
      }"
      :title="song.unavailable ? '暂无版权' : undefined"
      @dblclick="play(song)"
      @contextmenu="songMenu.open($event, song, songs, playlistId)"
    >
      <span class="flex justify-center text-xs text-muted tabular-nums">
        <template v-if="song.id === currentId">
          <i-ri-volume-up-fill v-if="status === PlayStatus.Playing" class="text-sm text-primary" />
          <i-ri-music-2-fill v-else class="text-sm text-primary" />
        </template>
        <template v-else>{{ String(index + 1).padStart(2, '0') }}</template>
      </span>
      <LikeButton :song-id="song.id" />
      <span class="flex min-w-0 items-center gap-1.5">
        <span class="truncate">{{ song.name }}</span>
        <n-tag v-if="song.fee === 1" size="tiny" type="primary" :bordered="false" class="shrink-0">
          VIP
        </n-tag>
      </span>
      <span class="truncate" :class="{ 'text-muted': song.id !== currentId }">
        {{ joinArtists(song.artists) }}
      </span>
      <span class="truncate" :class="{ 'text-muted': song.id !== currentId }">
        {{ song.album.name }}
      </span>
      <span class="text-right text-xs text-muted tabular-nums">
        {{ formatDuration(song.duration / 1000) }}
      </span>
    </div>
  </div>
</template>

<style scoped>
/* 数千首的歌单不做虚拟滚动，靠 content-visibility 跳过屏幕外行的渲染 */
.song-row {
  content-visibility: auto;
  contain-intrinsic-size: auto 40px;
}
</style>
