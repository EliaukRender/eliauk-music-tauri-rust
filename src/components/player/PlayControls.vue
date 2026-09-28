<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { type Component, computed } from 'vue'

import { PlayMode, PlayStatus } from '@/constants/player'
import { usePlayerStore } from '@/stores/player'
import IconRepeat from '~icons/ri/repeat-2-line'
import IconRepeatOne from '~icons/ri/repeat-one-line'
import IconShuffle from '~icons/ri/shuffle-line'

const player = usePlayerStore()
const { mode, status, currentSong } = storeToRefs(player)

const modeMeta: Record<PlayMode, { label: string; icon: Component }> = {
  [PlayMode.Sequence]: { label: '列表循环', icon: IconRepeat },
  [PlayMode.Shuffle]: { label: '随机播放', icon: IconShuffle },
  [PlayMode.RepeatOne]: { label: '单曲循环', icon: IconRepeatOne },
}

const currentMode = computed(() => modeMeta[mode.value])
const disabled = computed(() => !currentSong.value)
</script>

<template>
  <div class="flex items-center gap-5 text-xl">
    <button class="text-muted hover:text-fg" :title="currentMode.label" @click="player.cycleMode()">
      <component :is="currentMode.icon" class="text-lg" />
    </button>
    <button
      class="text-muted hover:text-fg disabled:opacity-40"
      title="上一首"
      :disabled="disabled"
      @click="player.prev()"
    >
      <i-ri-skip-back-fill />
    </button>
    <button
      class="flex size-9 items-center justify-center rounded-full bg-primary text-white hover:bg-primary-hover disabled:opacity-40"
      :title="status === PlayStatus.Playing ? '暂停' : '播放'"
      :disabled="disabled"
      @click="player.toggle()"
    >
      <i-ri-loader-4-line v-if="status === PlayStatus.Loading" class="animate-spin" />
      <i-ri-pause-fill v-else-if="status === PlayStatus.Playing" />
      <i-ri-play-fill v-else />
    </button>
    <button
      class="text-muted hover:text-fg disabled:opacity-40"
      title="下一首"
      :disabled="disabled"
      @click="player.next()"
    >
      <i-ri-skip-forward-fill />
    </button>
    <!-- 占位，与左侧模式按钮对称 -->
    <span class="size-[18px]" />
  </div>
</template>
