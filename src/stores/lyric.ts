import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'

import { fetchLyric } from '@/api/modules/lyric'
import { buildLyric } from '@/utils/lyric/build'
import type { LyricLine } from '@/utils/lyric/types'

import { usePlayerStore } from './player'

export const LyricStatus = {
  Idle: 'idle',
  Loading: 'loading',
  Ready: 'ready',
  /** 没有歌词 */
  Empty: 'empty',
  Pure: 'pure',
  Error: 'error',
} as const
export type LyricStatus = (typeof LyricStatus)[keyof typeof LyricStatus]

/** 偏移调节步长（秒） */
export const LYRIC_OFFSET_STEP = 0.5

const PURE_MUSIC_RE = /纯音乐，请欣赏/

export const useLyricStore = defineStore(
  'lyric',
  () => {
    const player = usePlayerStore()

    const songId = ref<number | null>(null)
    const lines = ref<LyricLine[]>([])
    const hasYrc = ref(false)
    const hasTrans = ref(false)
    const hasRoma = ref(false)
    const status = ref<LyricStatus>(LyricStatus.Idle)
    /** 按歌曲持久化，只保存非 0 值 */
    const offsets = ref<Record<number, number>>({})
    const showTrans = ref(true)
    const showRoma = ref(false)
    /** 全屏歌词页是否展开 */
    const visible = ref(false)

    const offset = computed(() => (songId.value === null ? 0 : (offsets.value[songId.value] ?? 0)))

    let requestSeq = 0

    async function load(id: number) {
      const seq = ++requestSeq
      songId.value = id
      lines.value = []
      status.value = LyricStatus.Loading
      try {
        const res = await fetchLyric(id)
        if (seq !== requestSeq) return
        const parsed = buildLyric(res, player.duration)
        const content = parsed.lines.filter((l) => !l.meta)
        if (res.pureMusic || (content.length <= 1 && PURE_MUSIC_RE.test(content[0]?.text ?? ''))) {
          status.value = LyricStatus.Pure
          return
        }
        lines.value = parsed.lines
        hasYrc.value = parsed.hasYrc
        hasTrans.value = parsed.hasTrans
        hasRoma.value = parsed.hasRoma
        status.value = content.length ? LyricStatus.Ready : LyricStatus.Empty
      } catch (error) {
        if (seq !== requestSeq) return
        console.warn('[lyric] 歌词加载失败', error)
        status.value = LyricStatus.Error
      }
    }

    function reset() {
      requestSeq++
      songId.value = null
      lines.value = []
      status.value = LyricStatus.Idle
    }

    function adjustOffset(delta: number) {
      if (songId.value === null) return
      const value = Math.round((offset.value + delta) * 10) / 10
      const next = { ...offsets.value }
      if (value === 0) delete next[songId.value]
      else next[songId.value] = value
      offsets.value = next
    }

    function resetOffset() {
      adjustOffset(-offset.value)
    }

    // 只在歌词页展开时加载，收起状态下切歌不发请求
    watch(
      [visible, () => player.currentId],
      ([isVisible, id]) => {
        if (!isVisible) return
        if (id === null) reset()
        else if (id !== songId.value || status.value === LyricStatus.Error) void load(id)
      },
      { immediate: true },
    )

    return {
      songId,
      lines,
      hasYrc,
      hasTrans,
      hasRoma,
      status,
      offsets,
      offset,
      showTrans,
      showRoma,
      visible,
      load,
      adjustOffset,
      resetOffset,
    }
  },
  { persist: { pick: ['offsets', 'showTrans', 'showRoma'] } },
)
