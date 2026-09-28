<script setup lang="ts">
import { storeToRefs } from 'pinia'

import WindowControls from '@/components/layout/WindowControls.vue'
import LikeButton from '@/components/player/LikeButton.vue'
import SpectrumCanvas from '@/components/spectrum/SpectrumCanvas.vue'
import { toggleFullscreen } from '@/services/tauri/window'
import { useAppStore } from '@/stores/app'
import { LyricStatus, useLyricStore } from '@/stores/lyric'
import { usePlayerStore } from '@/stores/player'
import { joinArtists } from '@/utils/format'
import { isDesktop, isMacOS } from '@/utils/platform'

import JukeBox from './components/JukeBox.vue'
import LyricBackground from './components/LyricBackground.vue'
import LyricScroller from './components/LyricScroller.vue'
import LyricToolbar from './components/LyricToolbar.vue'

const lyric = useLyricStore()
const { visible, lines, status, offset, showTrans, showRoma } = storeToRefs(lyric)
const { currentSong, isPlaying } = storeToRefs(usePlayerStore())
const { isFullscreen } = storeToRefs(useAppStore())

const statusText: Partial<Record<LyricStatus, string>> = {
  [LyricStatus.Loading]: '歌词加载中…',
  [LyricStatus.Empty]: '暂无歌词',
  [LyricStatus.Pure]: '纯音乐，请欣赏',
  [LyricStatus.Error]: '歌词加载失败',
  [LyricStatus.Idle]: '暂无播放',
}
</script>

<template>
  <Transition name="lyric-slide">
    <section
      v-if="visible"
      class="dark absolute inset-x-0 top-0 bottom-[72px] z-30 flex flex-col overflow-hidden text-white"
    >
      <LyricBackground :cover="currentSong?.album.picUrl ?? ''" />
      <SpectrumCanvas class="absolute! inset-x-0 bottom-0 h-28! opacity-60" />

      <header
        data-tauri-drag-region
        class="relative flex h-14 shrink-0 items-center gap-2"
        :class="isMacOS ? 'pl-24' : 'pl-5'"
      >
        <button
          class="flex size-8 items-center justify-center rounded-full text-xl text-white/80 hover:bg-white/10 hover:text-white"
          title="收起（Esc）"
          @click="visible = false"
        >
          <i-ri-arrow-down-s-line />
        </button>
        <div data-tauri-drag-region class="h-full flex-1" />
        <button
          v-if="isDesktop"
          class="mr-3 flex size-8 items-center justify-center rounded-full text-lg text-white/80 hover:bg-white/10 hover:text-white"
          :title="isFullscreen ? '退出全屏' : '全屏'"
          @click="toggleFullscreen()"
        >
          <i-ri-fullscreen-exit-line v-if="isFullscreen" />
          <i-ri-fullscreen-line v-else />
        </button>
        <WindowControls v-if="isDesktop && !isMacOS" />
      </header>

      <div
        class="relative grid min-h-0 flex-1 grid-cols-[minmax(0,5fr)_minmax(0,6fr)] items-center gap-16 px-16 pb-8"
      >
        <div class="flex flex-col items-center gap-8">
          <div class="w-[min(360px,80%)]">
            <JukeBox :cover="currentSong?.album.picUrl ?? ''" :playing="isPlaying" />
          </div>
          <div v-if="currentSong" class="w-full max-w-[420px] text-center">
            <h2 class="flex items-center justify-center gap-2 text-2xl font-semibold">
              <span class="truncate">{{ currentSong.name }}</span>
              <LikeButton :song-id="currentSong.id" class="text-xl text-white/80!" />
            </h2>
            <p class="mt-2 truncate text-sm text-white/60">
              {{ joinArtists(currentSong.artists) }} · {{ currentSong.album.name }}
            </p>
          </div>
        </div>

        <div class="relative flex h-full min-h-0 flex-col">
          <LyricScroller
            v-if="status === LyricStatus.Ready"
            class="min-h-0 flex-1"
            :lines="lines"
            :offset="offset"
            :show-trans="showTrans"
            :show-roma="showRoma"
          />
          <div v-else class="flex flex-1 items-center text-2xl font-semibold text-white/60">
            {{ statusText[status] }}
          </div>

          <LyricToolbar v-if="status === LyricStatus.Ready" class="shrink-0 pt-3" />
        </div>
      </div>
    </section>
  </Transition>
</template>

<style scoped>
.lyric-slide-enter-active,
.lyric-slide-leave-active {
  transition:
    transform 0.35s cubic-bezier(0.32, 0.72, 0, 1),
    opacity 0.35s;
}

.lyric-slide-enter-from,
.lyric-slide-leave-to {
  transform: translateY(100%);
  opacity: 0.6;
}
</style>
