<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { ref, useTemplateRef } from 'vue'

import { CONTENT_OVERLAY_ID } from '@/constants/layout'
import { useAppStore } from '@/stores/app'
import { useHistoryStore } from '@/stores/history'
import { usePlayerStore } from '@/stores/player'

import HistoryList from './HistoryList.vue'
import QueueList from './QueueList.vue'

type Tab = 'queue' | 'history'

const { queueDrawerVisible } = storeToRefs(useAppStore())
const player = usePlayerStore()
const history = useHistoryStore()
const { queue } = storeToRefs(player)
const { entries } = storeToRefs(history)

const tab = ref<Tab>('queue')
const queueListRef = useTemplateRef<InstanceType<typeof QueueList>>('queueList')

function onAfterEnter() {
  if (tab.value === 'queue') queueListRef.value?.scrollToCurrent()
}

/** 每次打开都回到播放队列，与快捷键、mini 窗口「打开队列」的语义一致 */
function onAfterLeave() {
  tab.value = 'queue'
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
    @after-enter="onAfterEnter"
    @after-leave="onAfterLeave"
  >
    <n-drawer-content :body-content-style="{ padding: 0, height: '100%' }">
      <template #header>
        <div class="flex w-full items-center justify-between">
          <div class="flex items-baseline gap-4">
            <button
              v-for="item in [
                { key: 'queue', label: '播放队列', count: queue.length },
                { key: 'history', label: '最近播放', count: entries.length },
              ] as const"
              :key="item.key"
              :class="tab === item.key ? 'text-fg' : 'text-muted font-normal hover:text-fg'"
              @click="tab = item.key"
            >
              {{ item.label }}
              <span class="ml-0.5 text-sm font-normal text-muted">{{ item.count }}</span>
            </button>
          </div>
          <n-button
            v-if="tab === 'queue'"
            text
            size="small"
            :disabled="!queue.length"
            class="text-muted!"
            @click="player.clearQueue()"
          >
            <template #icon><i-ri-delete-bin-6-line /></template>
            清空
          </n-button>
          <n-popconfirm v-else :show-icon="false" @positive-click="history.clear()">
            <template #trigger>
              <n-button text size="small" :disabled="!entries.length" class="text-muted!">
                <template #icon><i-ri-delete-bin-6-line /></template>
                清空
              </n-button>
            </template>
            清空全部播放记录？
          </n-popconfirm>
        </div>
      </template>

      <QueueList v-if="tab === 'queue'" ref="queueList" />
      <HistoryList v-else />
    </n-drawer-content>
  </n-drawer>
</template>
