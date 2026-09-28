<script setup lang="ts">
import { useAsyncState } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { useTemplateRef, watch } from 'vue'

import {
  fetchBanners,
  fetchDailyPlaylists,
  fetchHighQualityPlaylists,
  fetchNewSongs,
  fetchRecommendPlaylists,
} from '@/api/modules/recommend'
import PlaylistCard from '@/components/playlist/PlaylistCard.vue'
import SongCard from '@/components/song/SongCard.vue'
import { useHorizontalWheel } from '@/composables/useHorizontalWheel'
import { useUserStore } from '@/stores/user'

import BannerCarousel from './components/BannerCarousel.vue'

defineOptions({ name: 'DiscoverView' })

const { isLoggedIn } = storeToRefs(useUserStore())

const { state, isLoading, error, execute } = useAsyncState(async () => {
  const [banners, recommend, highQuality, newSongs] = await Promise.all([
    fetchBanners(),
    // 每日推荐需要登录，失败时退回通用推荐
    isLoggedIn.value
      ? fetchDailyPlaylists().catch(() => fetchRecommendPlaylists(20))
      : fetchRecommendPlaylists(20),
    fetchHighQualityPlaylists(10),
    fetchNewSongs(12),
  ])
  return { banners, recommend, highQuality, newSongs }
}, null)

// 登录状态变化后「推荐歌单」在每日推荐与通用推荐之间切换
watch(isLoggedIn, () => void execute())

const newSongsRef = useTemplateRef<HTMLElement>('newSongs')
useHorizontalWheel(newSongsRef)
</script>

<template>
  <div class="mx-auto max-w-[1280px]">
    <n-result
      v-if="error && !state"
      status="warning"
      title="内容加载失败"
      :description="(error as Error).message"
      class="py-24"
    >
      <template #footer>
        <n-button type="primary" @click="execute()">重新加载</n-button>
      </template>
    </n-result>

    <template v-else>
      <n-skeleton v-if="isLoading && !state" height="220px" class="rounded-2xl" />
      <BannerCarousel v-else-if="state?.banners.length" :banners="state.banners" />

      <h2 class="mt-8 mb-4 text-lg font-semibold">
        {{ isLoggedIn ? '每日推荐歌单' : '推荐歌单' }}
      </h2>
      <div class="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-5">
        <template v-if="!state">
          <n-skeleton v-for="n in 10" :key="n" class="aspect-square rounded-xl" />
        </template>
        <PlaylistCard v-for="item in state?.recommend" v-else :key="item.id" :playlist="item" />
      </div>

      <h2 class="mt-10 mb-3 text-lg font-semibold">新歌速递</h2>
      <div
        ref="newSongs"
        class="grid auto-cols-[minmax(240px,1fr)] grid-flow-col grid-rows-3 gap-x-4 overflow-x-auto pb-2"
      >
        <SongCard
          v-for="song in state?.newSongs"
          :key="song.id"
          :song="song"
          :songs="state!.newSongs"
        />
      </div>

      <h2 class="mt-10 mb-4 text-lg font-semibold">精品歌单</h2>
      <div class="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-5">
        <PlaylistCard v-for="item in state?.highQuality" :key="item.id" :playlist="item" />
      </div>
    </template>
  </div>
</template>
