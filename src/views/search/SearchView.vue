<script setup lang="ts">
import { useIntersectionObserver } from '@vueuse/core'
import { computed, useTemplateRef, watch } from 'vue'
import { useRouter } from 'vue-router'

import { searchArtists, searchPlaylists, searchSongs } from '@/api/modules/search'
import PlaylistCard from '@/components/common/PlaylistCard.vue'
import SongList from '@/components/song/SongList.vue'
import { usePagedList } from '@/composables/usePagedList'
import { RouteName } from '@/constants/route'
import { usePlayerStore } from '@/stores/player'
import ArtistCard from '@/views/artist/components/ArtistCard.vue'

const SearchTab = { Song: 'song', Playlist: 'playlist', Artist: 'artist' } as const
type SearchTab = (typeof SearchTab)[keyof typeof SearchTab]

const props = defineProps<{ keywords: string; type?: string }>()

const router = useRouter()
const player = usePlayerStore()

const tab = computed<SearchTab>(() =>
  Object.values(SearchTab).includes(props.type as SearchTab)
    ? (props.type as SearchTab)
    : SearchTab.Song,
)

const lists = {
  [SearchTab.Song]: usePagedList((offset, limit) => searchSongs(props.keywords, offset, limit)),
  [SearchTab.Playlist]: usePagedList((offset, limit) =>
    searchPlaylists(props.keywords, offset, limit),
  ),
  [SearchTab.Artist]: usePagedList((offset, limit) => searchArtists(props.keywords, offset, limit)),
}
const songs = lists[SearchTab.Song]
const playlists = lists[SearchTab.Playlist]
const artists = lists[SearchTab.Artist]
const current = computed(() => lists[tab.value])

// 关键词变化时清空全部分类，切换分类时只在首次进入时加载
watch(
  () => props.keywords,
  () => Object.values(lists).forEach((list) => list.reset()),
)
watch(
  [() => props.keywords, tab],
  () => {
    if (!current.value.items.value.length) void current.value.loadMore()
  },
  { immediate: true },
)

const sentinel = useTemplateRef<HTMLElement>('sentinel')
useIntersectionObserver(
  sentinel,
  ([entry]) => {
    if (entry?.isIntersecting && current.value.items.value.length && !current.value.error.value) {
      void current.value.loadMore()
    }
  },
  { rootMargin: '400px' },
)

function switchTab(value: SearchTab) {
  void router.replace({ name: RouteName.Search, query: { keywords: props.keywords, type: value } })
}
</script>

<template>
  <div class="mx-auto max-w-[1280px]">
    <h1 class="pt-2 pb-2 text-xl font-semibold">
      搜索「{{ keywords }}」
      <span v-if="current.total.value" class="ml-2 text-sm font-normal text-muted">
        找到 {{ current.total.value }} 个结果
      </span>
    </h1>

    <n-tabs :value="tab" type="line" class="mb-4" @update:value="switchTab">
      <n-tab :name="SearchTab.Song">单曲</n-tab>
      <n-tab :name="SearchTab.Playlist">歌单</n-tab>
      <n-tab :name="SearchTab.Artist">歌手</n-tab>
    </n-tabs>

    <template v-if="tab === SearchTab.Song">
      <n-button
        v-if="songs.items.value.length"
        type="primary"
        round
        size="small"
        class="mb-2"
        @click="player.playSongs(songs.items.value)"
      >
        <template #icon><i-ri-play-fill /></template>
        播放全部
      </n-button>
      <SongList
        :songs="songs.items.value"
        :loading="songs.loading.value && !songs.items.value.length"
      />
    </template>

    <div
      v-else-if="tab === SearchTab.Playlist"
      class="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-5"
    >
      <PlaylistCard v-for="item in playlists.items.value" :key="item.id" :playlist="item" />
    </div>

    <div v-else class="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-x-5 gap-y-6">
      <ArtistCard v-for="item in artists.items.value" :key="item.id" :artist="item" />
    </div>

    <div ref="sentinel" class="flex h-16 items-center justify-center text-sm text-muted">
      <n-spin v-if="current.loading.value && current.items.value.length" size="small" />
      <n-button v-else-if="current.error.value" size="small" @click="current.loadMore()">
        加载失败，点击重试
      </n-button>
      <n-empty
        v-else-if="!current.hasMore.value && !current.items.value.length"
        description="没有找到相关结果"
      />
      <span v-else-if="!current.hasMore.value">没有更多了</span>
    </div>
  </div>
</template>
