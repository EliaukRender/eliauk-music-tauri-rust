<script setup lang="ts">
import { useAsyncState } from '@vueuse/core'
import { watch } from 'vue'

import { fetchPlaylistDetail, fetchPlaylistTracks } from '@/api/modules/playlist'
import SongList from '@/components/song/SongList.vue'
import { usePlayerStore } from '@/stores/player'
import { formatPlayCount, resizeImage } from '@/utils/format'

const props = defineProps<{ id: number }>()

const player = usePlayerStore()

const { state, isLoading, error, execute } = useAsyncState(
  async (id: number) => {
    const [detail, songs] = await Promise.all([fetchPlaylistDetail(id), fetchPlaylistTracks(id)])
    return { detail, songs }
  },
  null,
  { immediate: false, resetOnExecute: true },
)

watch(
  () => props.id,
  (id) => void execute(0, id),
  { immediate: true },
)
</script>

<template>
  <div class="mx-auto max-w-[1280px]">
    <n-result
      v-if="error"
      status="warning"
      title="歌单加载失败"
      :description="(error as Error).message"
      class="py-24"
    >
      <template #footer>
        <n-button type="primary" @click="execute(0, id)">重新加载</n-button>
      </template>
    </n-result>

    <template v-else>
      <header class="flex gap-6 pt-2 pb-6">
        <n-skeleton v-if="isLoading" class="size-48 shrink-0 rounded-2xl" />
        <img
          v-else-if="state"
          :src="resizeImage(state.detail.coverImgUrl, 400)"
          :alt="state.detail.name"
          draggable="false"
          class="size-48 shrink-0 rounded-2xl object-cover shadow-md"
        />

        <div v-if="state" class="flex min-w-0 flex-col gap-3">
          <n-tag size="small" type="primary" :bordered="false" class="self-start">歌单</n-tag>
          <h1 class="line-clamp-2 text-2xl font-semibold">{{ state.detail.name }}</h1>
          <div class="flex items-center gap-2 text-sm text-muted">
            <n-avatar
              v-if="state.detail.creator.avatarUrl"
              round
              :size="24"
              :src="resizeImage(state.detail.creator.avatarUrl, 48)"
            />
            <span>{{ state.detail.creator.nickname }}</span>
            <span>·</span>
            <span>{{ state.detail.trackCount }} 首</span>
            <span>·</span>
            <span>{{ formatPlayCount(state.detail.playCount) }} 次播放</span>
          </div>
          <div v-if="state.detail.tags.length" class="flex gap-1.5">
            <n-tag v-for="tag in state.detail.tags" :key="tag" size="small" round>
              {{ tag }}
            </n-tag>
          </div>
          <p
            v-if="state.detail.description"
            class="line-clamp-2 text-xs leading-relaxed whitespace-pre-line text-muted"
            :title="state.detail.description"
          >
            {{ state.detail.description }}
          </p>
          <div class="mt-auto">
            <n-button type="primary" round @click="player.playSongs(state.songs)">
              <template #icon><i-ri-play-fill /></template>
              播放全部
            </n-button>
          </div>
        </div>
        <div v-else-if="isLoading" class="flex flex-1 flex-col gap-3">
          <n-skeleton text :repeat="2" class="max-w-md" />
          <n-skeleton text class="max-w-xs" />
        </div>
      </header>

      <SongList :songs="state?.songs ?? []" :loading="isLoading" />
    </template>
  </div>
</template>
