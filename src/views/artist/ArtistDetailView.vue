<script setup lang="ts">
import { useAsyncState } from '@vueuse/core'
import { watch } from 'vue'

import { fetchArtistAlbums, fetchArtistDetail, fetchArtistTopSongs } from '@/api/modules/artist'
import SongList from '@/components/song/SongList.vue'
import { usePlayerStore } from '@/stores/player'
import { resizeImage } from '@/utils/format'

const props = defineProps<{ id: number }>()

const player = usePlayerStore()

const { state, isLoading, error, execute } = useAsyncState(
  async (id: number) => {
    const [detail, songs, { albums }] = await Promise.all([
      fetchArtistDetail(id),
      fetchArtistTopSongs(id),
      fetchArtistAlbums(id, 30),
    ])
    return { detail, songs, albums }
  },
  null,
  { immediate: false, resetOnExecute: true },
)

watch(
  () => props.id,
  (id) => void execute(0, id),
  { immediate: true },
)

const year = (time: number) => (time ? new Date(time).getFullYear() : '')
</script>

<template>
  <div class="mx-auto max-w-[1280px]">
    <n-result
      v-if="error"
      status="warning"
      title="歌手信息加载失败"
      :description="(error as Error).message"
      class="py-24"
    >
      <template #footer>
        <n-button type="primary" @click="execute(0, id)">重新加载</n-button>
      </template>
    </n-result>

    <template v-else>
      <header class="flex gap-6 pt-2 pb-6">
        <img
          v-if="state"
          :src="resizeImage(state.detail.avatar, 400)"
          :alt="state.detail.name"
          draggable="false"
          class="size-44 shrink-0 rounded-full object-cover shadow-md"
        />
        <n-skeleton v-else circle class="size-44! shrink-0" />

        <div v-if="state" class="flex min-w-0 flex-col gap-3 pt-2">
          <n-tag size="small" type="primary" :bordered="false" class="self-start">歌手</n-tag>
          <h1 class="text-2xl font-semibold">
            {{ state.detail.name }}
            <span v-if="state.detail.alias.length" class="ml-2 text-base font-normal text-muted">
              {{ state.detail.alias.join(' / ') }}
            </span>
          </h1>
          <p class="text-sm text-muted">
            单曲 {{ state.detail.musicSize }} · 专辑 {{ state.detail.albumSize }}
          </p>
          <p
            v-if="state.detail.briefDesc"
            class="line-clamp-3 max-w-3xl text-xs leading-relaxed whitespace-pre-line text-muted"
            :title="state.detail.briefDesc"
          >
            {{ state.detail.briefDesc }}
          </p>
          <div class="mt-auto">
            <n-button type="primary" round @click="player.playSongs(state.songs)">
              <template #icon><i-ri-play-fill /></template>
              播放热门歌曲
            </n-button>
          </div>
        </div>
        <div v-else-if="isLoading" class="flex flex-1 flex-col gap-3 pt-2">
          <n-skeleton text :repeat="2" class="max-w-md" />
          <n-skeleton text class="max-w-xs" />
        </div>
      </header>

      <h2 class="mb-2 text-base font-semibold">热门歌曲</h2>
      <SongList :songs="state?.songs ?? []" :loading="isLoading && !state" />

      <template v-if="state?.albums.length">
        <h2 class="mt-10 mb-4 text-base font-semibold">专辑</h2>
        <div class="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-5">
          <div v-for="album in state.albums" :key="album.id">
            <img
              :src="resizeImage(album.picUrl, 300)"
              :alt="album.name"
              loading="lazy"
              draggable="false"
              class="aspect-square w-full rounded-xl bg-elevated object-cover"
            />
            <p class="mt-2 truncate text-sm" :title="album.name">{{ album.name }}</p>
            <p class="text-xs text-muted">{{ year(album.publishTime) }}</p>
          </div>
        </div>
      </template>
    </template>
  </div>
</template>
