<script setup lang="ts">
import type { VirtualListInst } from 'naive-ui'
import { onMounted, useTemplateRef } from 'vue'

import type { MiniSong } from '@/types/mini'

const ITEM_HEIGHT = 44

const props = defineProps<{ queue: MiniSong[]; currentId: number | null }>()
defineEmits<{ play: [id: number] }>()

const listRef = useTemplateRef<VirtualListInst>('list')

onMounted(() => {
  const index = props.queue.findIndex((s) => s.id === props.currentId)
  if (index > 2) listRef.value?.scrollTo({ top: (index - 2) * ITEM_HEIGHT })
})
</script>

<template>
  <n-empty v-if="!queue.length" description="播放队列为空" size="small" class="pt-16" />
  <n-virtual-list
    v-else
    ref="list"
    :items="queue"
    :item-size="ITEM_HEIGHT"
    key-field="id"
    class="h-full"
  >
    <template #default="{ item }">
      <div
        class="mx-2 flex h-11 cursor-default items-center gap-2 rounded-md px-2 text-sm hover:bg-black/4 dark:hover:bg-white/6"
        :class="{ 'text-primary': item.id === currentId }"
        @dblclick="$emit('play', item.id)"
      >
        <span class="min-w-0 flex-1 truncate">{{ item.name }}</span>
        <span
          class="max-w-24 shrink-0 truncate text-xs"
          :class="item.id === currentId ? 'text-primary/80' : 'text-muted'"
        >
          {{ item.artist }}
        </span>
      </div>
    </template>
  </n-virtual-list>
</template>
