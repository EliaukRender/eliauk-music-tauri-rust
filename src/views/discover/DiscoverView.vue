<script setup lang="ts">
import { useAsyncState } from '@vueuse/core'

import { fetchBanners, fetchRecommendPlaylists } from '@/api/modules/recommend'
import PlaylistCard from '@/components/common/PlaylistCard.vue'

const { state, isLoading, error, execute } = useAsyncState(async () => {
  const [banners, playlists] = await Promise.all([fetchBanners(), fetchRecommendPlaylists(20)])
  return { banners, playlists }
}, null)
</script>

<template>
  <div class="mx-auto max-w-[1280px]">
    <n-result
      v-if="error"
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
      <n-skeleton v-if="isLoading" height="220px" class="rounded-2xl" />
      <n-carousel
        v-else-if="state?.banners.length"
        autoplay
        draggable
        :slides-per-view="2"
        :space-between="16"
        class="h-[220px]"
      >
        <img
          v-for="banner in state.banners"
          :key="banner.imageUrl"
          :src="banner.imageUrl"
          :alt="banner.typeTitle"
          draggable="false"
          class="size-full rounded-2xl object-cover"
        />
      </n-carousel>

      <h2 class="mt-8 mb-4 text-lg font-semibold">推荐歌单</h2>
      <div class="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-5">
        <template v-if="isLoading">
          <n-skeleton v-for="n in 10" :key="n" class="aspect-square rounded-xl" />
        </template>
        <PlaylistCard v-for="item in state?.playlists" v-else :key="item.id" :playlist="item" />
      </div>
    </template>
  </div>
</template>
