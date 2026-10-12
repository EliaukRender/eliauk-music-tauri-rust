<script setup lang="ts">
import type { Song } from '@/types/music'
import { formatPlayedAt, joinArtists } from '@/utils/format'

defineProps<{ song: Song; playedAt: number; active: boolean }>()
defineEmits<{ play: []; remove: [] }>()
</script>

<template>
  <div
    class="group flex h-14 items-center gap-3 rounded-lg px-3 hover:bg-black/4 dark:hover:bg-white/6"
    :class="{ 'text-primary': active }"
    @dblclick="$emit('play')"
  >
    <div class="min-w-0 flex-1">
      <p class="truncate text-sm">{{ song.name }}</p>
      <p class="truncate text-xs" :class="active ? 'text-primary/80' : 'text-muted'">
        {{ joinArtists(song.artists) }}
      </p>
    </div>
    <span class="text-xs text-muted tabular-nums group-hover:hidden">
      {{ formatPlayedAt(playedAt) }}
    </span>
    <button
      class="hidden text-muted group-hover:block hover:text-fg"
      title="从播放历史删除"
      @click.stop="$emit('remove')"
    >
      <i-ri-close-line class="text-base" />
    </button>
  </div>
</template>
