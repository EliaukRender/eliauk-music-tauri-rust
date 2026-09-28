<script setup lang="ts">
import { useRouter } from 'vue-router'

import { usePlaylistPlayback } from '@/composables/usePlaylistPlayback'
import { RouteName } from '@/constants/route'
import type { Toplist } from '@/types/music'
import { resizeImage } from '@/utils/format'

const props = defineProps<{ toplist: Toplist }>()

const router = useRouter()
const { loading, playAll } = usePlaylistPlayback(() => props.toplist.id)

function open() {
  void router.push({ name: RouteName.Playlist, params: { id: props.toplist.id } })
}
</script>

<template>
  <div
    class="group flex cursor-pointer gap-4 rounded-2xl bg-surface p-4 ring-1 ring-line transition-shadow hover:shadow-md"
    @click="open"
  >
    <div class="relative size-28 shrink-0 overflow-hidden rounded-xl">
      <img
        :src="resizeImage(toplist.coverImgUrl, 240)"
        :alt="toplist.name"
        draggable="false"
        class="size-full object-cover"
      />
      <button
        title="播放全部"
        class="absolute right-2 bottom-2 flex size-8 items-center justify-center rounded-full bg-white/90 text-primary opacity-0 shadow transition-opacity group-hover:opacity-100"
        :class="{ 'opacity-100': loading }"
        @click.stop="playAll"
      >
        <i-ri-loader-4-line v-if="loading" class="animate-spin" />
        <i-ri-play-fill v-else />
      </button>
    </div>
    <div class="min-w-0 flex-1">
      <div class="flex items-baseline justify-between gap-2">
        <h3 class="truncate font-semibold">{{ toplist.name }}</h3>
        <span class="shrink-0 text-xs text-muted">{{ toplist.updateFrequency }}</span>
      </div>
      <ol class="mt-2 space-y-1.5 text-sm">
        <li v-for="(track, index) in toplist.preview.slice(0, 3)" :key="index" class="flex gap-2">
          <span class="w-4 shrink-0 text-center font-semibold text-primary">{{ index + 1 }}</span>
          <span class="truncate">
            {{ track.name }}
            <span class="text-muted"> - {{ track.artist }}</span>
          </span>
        </li>
      </ol>
    </div>
  </div>
</template>
