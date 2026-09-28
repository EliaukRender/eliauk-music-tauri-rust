<script setup lang="ts">
import { onKeyStroke } from '@vueuse/core'
import { storeToRefs } from 'pinia'

import WindowControls from '@/components/layout/WindowControls.vue'
import LikeButton from '@/components/player/LikeButton.vue'
import SpectrumCanvas from '@/components/spectrum/SpectrumCanvas.vue'
import { LYRIC_OFFSET_STEP, LyricStatus, useLyricStore } from '@/stores/lyric'
import { usePlayerStore } from '@/stores/player'
import { joinArtists } from '@/utils/format'
import { isDesktop, isMacOS } from '@/utils/platform'

import JukeBox from './components/JukeBox.vue'
import LyricBackground from './components/LyricBackground.vue'
import LyricScroller from './components/LyricScroller.vue'

const lyric = useLyricStore()
const { visible, lines, status, offset, showTrans, showRoma, hasTrans, hasRoma } =
  storeToRefs(lyric)
const { currentSong, isPlaying } = storeToRefs(usePlayerStore())

const statusText: Partial<Record<LyricStatus, string>> = {
  [LyricStatus.Loading]: '歌词加载中…',
  [LyricStatus.Empty]: '暂无歌词',
  [LyricStatus.Pure]: '纯音乐，请欣赏',
  [LyricStatus.Error]: '歌词加载失败',
  [LyricStatus.Idle]: '暂无播放',
}

onKeyStroke('Escape', () => {
  if (visible.value) visible.value = false
})

function formatOffset(value: number) {
  if (!value) return '歌词偏移'
  return `${value > 0 ? '提前' : '延后'} ${Math.abs(value).toFixed(1)}s`
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

          <div
            v-if="status === LyricStatus.Ready"
            class="flex shrink-0 items-center gap-2 pt-3 text-xs text-white/70"
          >
            <button
              v-if="hasTrans"
              class="lyric-chip"
              :class="{ 'is-on': showTrans }"
              @click="showTrans = !showTrans"
            >
              译
            </button>
            <button
              v-if="hasRoma"
              class="lyric-chip"
              :class="{ 'is-on': showRoma }"
              @click="showRoma = !showRoma"
            >
              音
            </button>
            <div class="ml-auto flex items-center gap-1">
              <button
                class="lyric-chip"
                title="歌词延后"
                @click="lyric.adjustOffset(-LYRIC_OFFSET_STEP)"
              >
                <i-ri-subtract-line />
              </button>
              <button
                class="min-w-20 rounded-full px-2 py-1 text-center hover:bg-white/10"
                title="点击重置"
                @click="lyric.resetOffset()"
              >
                {{ formatOffset(offset) }}
              </button>
              <button
                class="lyric-chip"
                title="歌词提前"
                @click="lyric.adjustOffset(LYRIC_OFFSET_STEP)"
              >
                <i-ri-add-line />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  </Transition>
</template>

<style scoped>
@reference '@/assets/styles/main.css';

.lyric-chip {
  @apply flex size-7 items-center justify-center rounded-full border border-white/20 hover:bg-white/10;
}

.lyric-chip.is-on {
  @apply border-white/60 bg-white/15 text-white;
}

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
