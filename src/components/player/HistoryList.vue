<script setup lang="ts">
import { storeToRefs } from 'pinia'

import { useSongMenu } from '@/features/context-menus'
import { useHistoryStore } from '@/stores/history'
import { usePlayerStore } from '@/stores/player'

import HistoryItem from './HistoryItem.vue'

const ITEM_HEIGHT = 56

const history = useHistoryStore()
const { entries } = storeToRefs(history)
const player = usePlayerStore()
const { currentId } = storeToRefs(player)
const songMenu = useSongMenu()
</script>

<template>
  <n-empty v-if="!entries.length" description="还没有播放记录" class="pt-24" />
  <n-virtual-list
    v-else
    :items="entries"
    :item-size="ITEM_HEIGHT"
    key-field="playedAt"
    class="h-full"
    :padding-top="6"
    :padding-bottom="6"
  >
    <template #default="{ item }">
      <div class="px-2">
        <HistoryItem
          :song="item.song"
          :played-at="item.playedAt"
          :active="item.song.id === currentId"
          @play="player.playSong(item.song)"
          @remove="history.remove(item.song.id)"
          @contextmenu="songMenu.open($event, item.song)"
        />
      </div>
    </template>
  </n-virtual-list>
</template>
