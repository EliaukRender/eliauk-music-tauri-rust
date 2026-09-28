<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, ref, watch } from 'vue'

import SongList from '@/components/song/SongList.vue'
import { usePlaylistActions } from '@/composables/usePlaylistActions'
import { usePlayerStore } from '@/stores/player'
import { usePlaylistStore } from '@/stores/playlist'
import { PlaylistSpecialType } from '@/types/music'
import { formatPlayCount, resizeImage } from '@/utils/format'

const props = defineProps<{ id: number }>()

const player = usePlayerStore()
const store = usePlaylistStore()
const { detailCache } = storeToRefs(store)
const { openRename, confirmDelete } = usePlaylistActions()

const loading = ref(false)
const error = ref<Error | null>(null)

// 从 store 读取，移除歌曲等乐观更新可以直接反映到页面
const entry = computed(() => detailCache.value.get(props.id) ?? null)

const editable = computed(
  () =>
    !!entry.value &&
    store.isOwned(props.id) &&
    entry.value.detail.specialType !== PlaylistSpecialType.Liked,
)

const menuOptions = [
  { label: '重命名', key: 'rename' },
  { label: '删除歌单', key: 'delete' },
]

function onMenuSelect(key: string) {
  const detail = entry.value?.detail
  if (!detail) return
  if (key === 'rename') openRename(detail)
  if (key === 'delete') confirmDelete(detail)
}

async function load(force = false) {
  const id = props.id
  loading.value = true
  error.value = null
  try {
    await store.fetchDetail(id, force)
  } catch (e) {
    if (id === props.id) error.value = e as Error
  } finally {
    if (id === props.id) loading.value = false
  }
}

watch(
  () => props.id,
  () => void load(),
  { immediate: true },
)
</script>

<template>
  <div class="mx-auto max-w-[1280px]">
    <n-result
      v-if="error && !entry"
      status="warning"
      title="歌单加载失败"
      :description="error.message"
      class="py-24"
    >
      <template #footer>
        <n-button type="primary" @click="load(true)">重新加载</n-button>
      </template>
    </n-result>

    <template v-else>
      <header class="flex gap-6 pt-2 pb-6">
        <img
          v-if="entry"
          :src="resizeImage(entry.detail.coverImgUrl, 400)"
          :alt="entry.detail.name"
          draggable="false"
          class="size-48 shrink-0 rounded-2xl object-cover shadow-md"
        />
        <n-skeleton v-else class="size-48 shrink-0 rounded-2xl" />

        <div v-if="entry" class="flex min-w-0 flex-col gap-3">
          <n-tag size="small" type="primary" :bordered="false" class="self-start">歌单</n-tag>
          <h1 class="line-clamp-2 text-2xl font-semibold">{{ entry.detail.name }}</h1>
          <div class="flex items-center gap-2 text-sm text-muted">
            <n-avatar
              v-if="entry.detail.creator.avatarUrl"
              round
              :size="24"
              :src="resizeImage(entry.detail.creator.avatarUrl, 48)"
            />
            <span>{{ entry.detail.creator.nickname }}</span>
            <span>·</span>
            <span>{{ entry.detail.trackCount }} 首</span>
            <span>·</span>
            <span>{{ formatPlayCount(entry.detail.playCount) }} 次播放</span>
          </div>
          <div v-if="entry.detail.tags.length" class="flex gap-1.5">
            <n-tag v-for="tag in entry.detail.tags" :key="tag" size="small" round>
              {{ tag }}
            </n-tag>
          </div>
          <p
            v-if="entry.detail.description"
            class="line-clamp-2 text-xs leading-relaxed whitespace-pre-line text-muted"
            :title="entry.detail.description"
          >
            {{ entry.detail.description }}
          </p>
          <div class="mt-auto flex items-center gap-2">
            <n-button type="primary" round @click="player.playSongs(entry.songs)">
              <template #icon><i-ri-play-fill /></template>
              播放全部
            </n-button>
            <n-button round :loading="loading" title="刷新" @click="load(true)">
              <template #icon><i-ri-refresh-line /></template>
            </n-button>
            <n-dropdown v-if="editable" :options="menuOptions" @select="onMenuSelect">
              <n-button round title="更多">
                <template #icon><i-ri-more-line /></template>
              </n-button>
            </n-dropdown>
          </div>
        </div>
        <div v-else class="flex flex-1 flex-col gap-3">
          <n-skeleton text :repeat="2" class="max-w-md" />
          <n-skeleton text class="max-w-xs" />
        </div>
      </header>

      <SongList :songs="entry?.songs ?? []" :loading="loading && !entry" />
    </template>
  </div>
</template>
