<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import { RouteName } from '@/constants/route'
import { notify } from '@/services/notify'
import { usePlayerStore } from '@/stores/player'
import { usePlaylistStore } from '@/stores/playlist'
import type { PlaylistSummary } from '@/types/music'
import { formatPlayCount, resizeImage } from '@/utils/format'

const props = defineProps<{ playlist: PlaylistSummary }>()

const router = useRouter()
const player = usePlayerStore()
const playlistStore = usePlaylistStore()
const loading = ref(false)

async function playAll() {
  if (loading.value) return
  loading.value = true
  try {
    player.playSongs((await playlistStore.fetchDetail(props.playlist.id)).songs)
  } catch (error) {
    notify.error(`歌单加载失败：${(error as Error).message}`)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div
    class="group cursor-pointer"
    @click="router.push({ name: RouteName.Playlist, params: { id: playlist.id } })"
  >
    <div class="relative aspect-square overflow-hidden rounded-xl bg-elevated">
      <img
        :src="resizeImage(playlist.picUrl, 300)"
        :alt="playlist.name"
        loading="lazy"
        draggable="false"
        class="size-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <span
        class="absolute top-2 right-2 flex items-center gap-0.5 rounded-full bg-black/40 px-2 py-0.5 text-xs text-white backdrop-blur"
      >
        <i-ri-play-fill class="text-[11px]" />
        {{ formatPlayCount(playlist.playCount) }}
      </span>
      <button
        title="播放全部"
        class="absolute right-3 bottom-3 flex size-9 translate-y-2 items-center justify-center rounded-full bg-white/90 text-primary opacity-0 shadow transition-all group-hover:translate-y-0 group-hover:opacity-100"
        :class="{ 'translate-y-0 opacity-100': loading }"
        @click.stop="playAll"
      >
        <i-ri-loader-4-line v-if="loading" class="animate-spin text-lg" />
        <i-ri-play-fill v-else class="text-lg" />
      </button>
    </div>
    <p class="mt-2 line-clamp-2 text-sm leading-snug">{{ playlist.name }}</p>
  </div>
</template>
