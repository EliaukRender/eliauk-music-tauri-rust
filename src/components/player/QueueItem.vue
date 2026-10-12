<script setup lang="ts">
import type { Song } from '@/types/music'
import { formatDuration, joinArtists } from '@/utils/format'

defineProps<{ song: Song; active: boolean; playing: boolean; dragging?: boolean }>()
defineEmits<{ play: []; remove: []; dragStart: [event: PointerEvent] }>()
</script>

<template>
  <div
    class="group flex h-14 items-center gap-2 rounded-lg pr-3 pl-1 hover:bg-black/4 dark:hover:bg-white/6"
    :class="{ 'text-primary': active, 'opacity-40': dragging }"
    @dblclick="$emit('play')"
  >
    <button
      class="flex h-full w-5 shrink-0 cursor-grab items-center justify-center text-muted opacity-0 group-hover:opacity-100 hover:text-fg"
      title="拖动排序"
      @pointerdown="$emit('dragStart', $event)"
      @dblclick.stop
    >
      <i-ri-draggable class="text-base" />
    </button>
    <div class="min-w-0 flex-1">
      <p class="flex items-center gap-1.5 text-sm">
        <i-ri-volume-up-fill v-if="active && playing" class="shrink-0 text-xs" />
        <i-ri-music-2-fill v-else-if="active" class="shrink-0 text-xs" />
        <span class="truncate">{{ song.name }}</span>
      </p>
      <p class="truncate text-xs" :class="active ? 'text-primary/80' : 'text-muted'">
        {{ joinArtists(song.artists) }}
      </p>
    </div>
    <span class="text-xs text-muted tabular-nums group-hover:hidden">
      {{ formatDuration(song.duration / 1000) }}
    </span>
    <button
      class="hidden text-muted group-hover:block hover:text-fg"
      title="从播放队列移除"
      @click.stop="$emit('remove')"
    >
      <i-ri-close-line class="text-base" />
    </button>
  </div>
</template>
