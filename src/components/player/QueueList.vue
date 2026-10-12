<script setup lang="ts">
import type { VirtualListInst } from 'naive-ui'
import { storeToRefs } from 'pinia'
import { useTemplateRef } from 'vue'

import { useListDragSort } from '@/composables/useListDragSort'
import { useQueueMenu } from '@/features/context-menus'
import { usePlayerStore } from '@/stores/player'

import QueueItem from './QueueItem.vue'

const ITEM_HEIGHT = 56
const PADDING = 6

const player = usePlayerStore()
const { queue, currentId, currentIndex, isPlaying } = storeToRefs(player)
const queueMenu = useQueueMenu()

const listRef = useTemplateRef<VirtualListInst & { getScrollContainer: () => HTMLElement | null }>(
  'list',
)
const wrapperRef = useTemplateRef<HTMLElement>('wrapper')

const { dragging, indicatorTop, start } = useListDragSort({
  getContainer: () => listRef.value?.getScrollContainer(),
  itemHeight: ITEM_HEIGHT,
  paddingTop: PADDING,
  count: () => queue.value.length,
  onDrop: (from, to) => player.moveInQueue(queue.value[from]!.id, to),
})

/** vueuc 的 scrollTo 不支持居中，按行高自行计算 */
function scrollToCurrent() {
  if (currentIndex.value < 0) return
  const viewport = wrapperRef.value?.clientHeight ?? 0
  const top = currentIndex.value * ITEM_HEIGHT - (viewport - ITEM_HEIGHT) / 2
  listRef.value?.scrollTo({ top: Math.max(top, 0) })
}

defineExpose({ scrollToCurrent })
</script>

<template>
  <div ref="wrapper" class="relative h-full">
    <n-empty v-if="!queue.length" description="队列为空，去发现音乐吧" class="pt-24" />
    <template v-else>
      <n-virtual-list
        ref="list"
        :items="queue"
        :item-size="ITEM_HEIGHT"
        key-field="id"
        class="h-full"
        :padding-top="PADDING"
        :padding-bottom="PADDING"
      >
        <template #default="{ item, index }">
          <div class="px-2">
            <QueueItem
              :song="item"
              :active="item.id === currentId"
              :playing="isPlaying"
              :dragging="dragging === index"
              @play="player.playSong(item)"
              @remove="player.removeFromQueue(item.id)"
              @drag-start="start($event, index)"
              @contextmenu="queueMenu.open($event, item)"
            />
          </div>
        </template>
      </n-virtual-list>
      <div
        v-if="indicatorTop !== null"
        class="pointer-events-none absolute inset-x-3 h-0.5 -translate-y-1/2 rounded-full bg-primary"
        :style="{ top: `${indicatorTop}px` }"
      />
    </template>
  </div>
</template>
