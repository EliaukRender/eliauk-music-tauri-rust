<script setup lang="ts">
import type { PlaylistSummary } from '@/types/music'
import { formatPlayCount, resizeImage } from '@/utils/format'

defineProps<{ playlist: PlaylistSummary }>()
</script>

<template>
  <div class="group cursor-pointer">
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
      <span
        class="absolute right-3 bottom-3 flex size-9 translate-y-2 items-center justify-center rounded-full bg-white/90 text-primary opacity-0 shadow transition-all group-hover:translate-y-0 group-hover:opacity-100"
      >
        <i-ri-play-fill class="text-lg" />
      </span>
    </div>
    <p class="mt-2 line-clamp-2 text-sm leading-snug">{{ playlist.name }}</p>
  </div>
</template>
