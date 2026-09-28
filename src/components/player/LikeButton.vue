<script setup lang="ts">
import { computed } from 'vue'

import { useLikeStore } from '@/stores/like'

const props = defineProps<{ songId: number }>()

const like = useLikeStore()
const liked = computed(() => like.isLiked(props.songId))
</script>

<template>
  <button
    class="flex shrink-0 items-center justify-center transition-transform active:scale-75"
    :class="liked ? 'text-primary' : 'text-muted hover:text-fg'"
    :title="liked ? '取消喜欢' : '喜欢'"
    :disabled="like.pending.has(songId)"
    @click.stop="like.toggle(songId)"
    @dblclick.stop
  >
    <i-ri-heart-3-fill v-if="liked" />
    <i-ri-heart-3-line v-else />
  </button>
</template>
