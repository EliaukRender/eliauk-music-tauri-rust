<script setup lang="ts">
import { isTauri } from '@tauri-apps/api/core'
import { invoke } from '@tauri-apps/api/core'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { storeToRefs } from 'pinia'
import { onScopeDispose, ref } from 'vue'

import { resizeMiniPlayer } from '@/services/tauri/mini'
import { useMiniStore } from '@/stores/mini'

import MiniQueue from './components/MiniQueue.vue'

/** 与 src-tauri/src/window/mini.rs 保持一致 */
const COLLAPSED_HEIGHT = 96
const EXPANDED_HEIGHT = 400

const mini = useMiniStore()
const { state, queue } = storeToRefs(mini)
const expanded = ref(false)

let disconnect: (() => void) | undefined
void mini.connect().then((fn) => (disconnect = fn))
onScopeDispose(() => disconnect?.())

// 展开时先放大窗口再显示列表，折叠时先收起列表再缩小窗口，避免内容被裁切闪烁
async function toggleQueue() {
  if (expanded.value) {
    expanded.value = false
    await resizeMiniPlayer(COLLAPSED_HEIGHT)
  } else {
    await resizeMiniPlayer(EXPANDED_HEIGHT)
    expanded.value = true
  }
}

function showMain() {
  if (isTauri()) void invoke('focus_main_window')
}

function hide() {
  if (isTauri()) void getCurrentWindow().hide()
}
</script>

<template>
  <div class="flex h-screen flex-col overflow-hidden bg-surface text-fg">
    <header data-tauri-drag-region="deep" class="flex h-24 shrink-0 items-center gap-3 pr-2 pl-4">
      <div class="size-16 shrink-0 overflow-hidden rounded-lg bg-elevated">
        <img
          v-if="state.song?.cover"
          :src="state.song.cover"
          alt=""
          draggable="false"
          class="pointer-events-none size-full object-cover"
        />
      </div>

      <div class="min-w-0 flex-1">
        <p class="truncate text-sm font-medium">{{ state.song?.name ?? '暂无播放' }}</p>
        <p class="truncate text-xs text-muted">{{ state.song?.artist ?? 'Eliauk 音乐' }}</p>
        <div class="mt-1.5 flex items-center gap-3 text-lg">
          <button
            v-if="state.loggedIn"
            class="transition-transform active:scale-75"
            :class="state.liked ? 'text-primary' : 'text-muted hover:text-fg'"
            :title="state.liked ? '取消喜欢' : '喜欢'"
            :disabled="!state.song"
            @click="mini.send({ type: 'toggle-like' })"
          >
            <i-ri-heart-3-fill v-if="state.liked" />
            <i-ri-heart-3-line v-else />
          </button>
          <button
            class="text-muted hover:text-fg disabled:opacity-40"
            title="上一首"
            :disabled="!state.song"
            @click="mini.send({ type: 'prev' })"
          >
            <i-ri-skip-back-fill />
          </button>
          <button
            class="flex size-8 items-center justify-center rounded-full bg-primary text-white hover:bg-primary-hover disabled:opacity-40"
            :title="state.isPlaying ? '暂停' : '播放'"
            :disabled="!state.song"
            @click="mini.send({ type: 'toggle' })"
          >
            <i-ri-pause-fill v-if="state.isPlaying" />
            <i-ri-play-fill v-else />
          </button>
          <button
            class="text-muted hover:text-fg disabled:opacity-40"
            title="下一首"
            :disabled="!state.song"
            @click="mini.send({ type: 'next' })"
          >
            <i-ri-skip-forward-fill />
          </button>
        </div>
      </div>

      <div class="flex flex-col items-center gap-1.5 self-stretch py-2 text-base text-muted">
        <button class="hover:text-fg" title="隐藏" @click="hide">
          <i-ri-close-line />
        </button>
        <button class="hover:text-fg" title="返回主界面" @click="showMain">
          <i-ri-fullscreen-line class="text-sm" />
        </button>
        <button
          class="hover:text-fg"
          :class="{ 'text-primary': expanded }"
          :title="expanded ? '收起播放队列' : '展开播放队列'"
          @click="toggleQueue"
        >
          <i-ri-play-list-2-line class="text-sm" />
        </button>
      </div>
    </header>

    <div v-if="expanded" class="min-h-0 flex-1 border-t border-line pt-1">
      <MiniQueue
        :queue="queue"
        :current-id="state.song?.id ?? null"
        @play="(id) => mini.send({ type: 'play-song', id })"
      />
    </div>
  </div>
</template>
