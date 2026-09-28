<script setup lang="ts">
import { useIntersectionObserver } from '@vueuse/core'
import { useTemplateRef } from 'vue'

import { useArtistList } from '@/composables/useArtistList'
import { artistAreaOptions, artistInitialOptions, artistTypeOptions } from '@/constants/artist'

import ArtistCard from './components/ArtistCard.vue'
import FilterRow from './components/FilterRow.vue'

defineOptions({ name: 'ArtistsView' })

const { filter, artists, loading, hasMore, error, loadMore } = useArtistList()

// 滚动容器在布局里，用底部哨兵触发加载，不依赖具体的滚动元素
const sentinel = useTemplateRef<HTMLElement>('sentinel')
useIntersectionObserver(
  sentinel,
  ([entry]) => {
    if (entry?.isIntersecting && !error.value) void loadMore()
  },
  { rootMargin: '400px' },
)
</script>

<template>
  <div class="mx-auto max-w-[1280px]">
    <h1 class="pt-2 pb-5 text-xl font-semibold">歌手</h1>

    <div class="space-y-2.5 rounded-2xl bg-surface p-4 ring-1 ring-line">
      <FilterRow v-model="filter.area" label="地区" :options="artistAreaOptions" />
      <FilterRow v-model="filter.type" label="类型" :options="artistTypeOptions" />
      <FilterRow v-model="filter.initial" label="筛选" :options="artistInitialOptions" />
    </div>

    <div class="mt-6 grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-x-5 gap-y-6">
      <ArtistCard v-for="artist in artists" :key="artist.id" :artist="artist" />
      <template v-if="loading && !artists.length">
        <n-skeleton v-for="n in 12" :key="n" circle class="aspect-square w-full!" />
      </template>
    </div>

    <div ref="sentinel" class="flex h-16 items-center justify-center text-sm text-muted">
      <n-spin v-if="loading && artists.length" size="small" />
      <n-button v-else-if="error" size="small" @click="loadMore()">加载失败，点击重试</n-button>
      <span v-else-if="!hasMore && artists.length">没有更多了</span>
      <n-empty v-else-if="!hasMore" description="没有符合条件的歌手" />
    </div>
  </div>
</template>
