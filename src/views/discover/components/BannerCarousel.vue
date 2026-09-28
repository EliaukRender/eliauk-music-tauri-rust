<script setup lang="ts">
import { useRouter } from 'vue-router'

import { fetchSongDetail } from '@/api/modules/song'
import { RouteName } from '@/constants/route'
import { notify } from '@/services/notify'
import { usePlayerStore } from '@/stores/player'
import type { Banner } from '@/types/music'

defineProps<{ banners: Banner[] }>()

/** 网易云 banner.targetType */
const TargetType = { Song: 1, Playlist: 1000 } as const

const router = useRouter()
const player = usePlayerStore()

function isClickable(banner: Banner) {
  return banner.targetType === TargetType.Song || banner.targetType === TargetType.Playlist
}

async function open(banner: Banner) {
  if (banner.targetType === TargetType.Playlist) {
    void router.push({ name: RouteName.Playlist, params: { id: banner.targetId } })
    return
  }
  if (banner.targetType === TargetType.Song) {
    try {
      const [song] = await fetchSongDetail([banner.targetId])
      if (song) player.playSong(song)
    } catch (error) {
      notify.error(`歌曲加载失败：${(error as Error).message}`)
    }
  }
}
</script>

<template>
  <n-carousel autoplay draggable :slides-per-view="2" :space-between="16" class="h-[220px]">
    <img
      v-for="banner in banners"
      :key="banner.imageUrl"
      :src="banner.imageUrl"
      :alt="banner.typeTitle"
      :title="banner.typeTitle"
      draggable="false"
      class="size-full rounded-2xl object-cover"
      :class="{ 'cursor-pointer': isClickable(banner) }"
      @click="open(banner)"
    />
  </n-carousel>
</template>
