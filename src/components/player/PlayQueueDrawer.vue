<script setup lang="ts">
import type { VirtualListInst } from 'naive-ui'
import { storeToRefs } from 'pinia'
import { useTemplateRef } from 'vue'

import { CONTENT_OVERLAY_ID } from '@/constants/layout'
import { useQueueMenu } from '@/features/context-menus'
import { useAppStore } from '@/stores/app'
import { usePlayerStore } from '@/stores/player'

import QueueItem from './QueueItem.vue'

const ITEM_HEIGHT = 56

const { queueDrawerVisible } = storeToRefs(useAppStore())
const player = usePlayerStore()
const { queue, currentId, currentIndex, isPlaying } = storeToRefs(player)

const queueMenu = useQueueMenu()

const listRef = useTemplateRef<VirtualListInst>('list')
const wrapperRef = useTemplateRef<HTMLElement>('wrapper')

/** vueuc 的 scrollTo 不支持居中，按行高自行计算 */
function scrollToCurrent() {
  if (currentIndex.value < 0) return
  const viewport = wrapperRef.value?.clientHeight ?? 0
  const top = currentIndex.value * ITEM_HEIGHT - (viewport - ITEM_HEIGHT) / 2
  listRef.value?.scrollTo({ top: Math.max(top, 0) })
}
</script>

<template>
  <n-drawer
    v-model:show="queueDrawerVisible"
    :to="`#${CONTENT_OVERLAY_ID}`"
    :width="380"
    placement="right"
    show-mask="transparent"
    :auto-focus="false"
    @after-enter="scrollToCurrent"
  >
    <n-drawer-content :body-content-style="{ padding: 0, height: '100%' }">
      <template #header>
        <div class="flex w-full items-center justify-between">
          <span>
            播放队列
            <span class="ml-1 text-sm font-normal text-muted">{{ queue.length }}</span>
          </span>
          <n-button
            text
            size="small"
            :disabled="!queue.length"
            class="text-muted!"
            @click="player.clearQueue()"
          >
            <template #icon><i-ri-delete-bin-6-line /></template>
            清空
          </n-button>
        </div>
      </template>

      <div ref="wrapper" class="h-full">
        <n-empty v-if="!queue.length" description="队列为空，去发现音乐吧" class="pt-24" />
        <n-virtual-list
          v-else
          ref="list"
          :items="queue"
          :item-size="ITEM_HEIGHT"
          key-field="id"
          class="h-full"
          :padding-top="6"
          :padding-bottom="6"
        >
          <template #default="{ item }">
            <div class="px-2">
              <QueueItem
                :song="item"
                :active="item.id === currentId"
                :playing="isPlaying"
                @play="player.playSong(item)"
                @remove="player.removeFromQueue(item.id)"
                @contextmenu="queueMenu.open($event, item)"
              />
            </div>
          </template>
        </n-virtual-list>
      </div>
    </n-drawer-content>
  </n-drawer>
</template>
