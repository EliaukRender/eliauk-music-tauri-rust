import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import {
  DEFAULT_BAR_COUNT,
  DEFAULT_SENSITIVITY,
  GradientDirection,
  type SpectrumColors,
  SpectrumLayout,
  SpectrumMode,
  spectrumPresets,
} from '@/constants/spectrum'
import type { SpectrumOptions } from '@/services/spectrum/renderer'

const PERSISTED_KEYS = [
  'mode',
  'layout',
  'colors',
  'presetId',
  'followCover',
  'gradient',
  'gradientDirection',
  'stroke',
  'rounded',
  'reflection',
  'peakCaps',
  'barCount',
  'sensitivity',
]

export const useSpectrumStore = defineStore(
  'spectrum',
  () => {
    const mode = ref<SpectrumMode>(SpectrumMode.Bars)
    const layout = ref<SpectrumLayout>(SpectrumLayout.Mirror)
    const colors = ref<SpectrumColors>([...spectrumPresets[0]!.colors])
    /** 选中预设时有值，自定义颜色时为 null */
    const presetId = ref<string | null>(spectrumPresets[0]!.id)
    /** 开启后用封面取色覆盖 colors，取色失败时回退到 colors */
    const followCover = ref(false)
    const gradient = ref(true)
    const gradientDirection = ref<GradientDirection>(GradientDirection.Horizontal)
    /** 1-6 */
    const stroke = ref(3)
    const rounded = ref(true)
    const reflection = ref(false)
    const peakCaps = ref(true)
    const barCount = ref(DEFAULT_BAR_COUNT)
    const sensitivity = ref(DEFAULT_SENSITIVITY)

    const options = computed<SpectrumOptions>(() => ({
      mode: mode.value,
      layout: layout.value,
      colors: colors.value,
      gradient: gradient.value,
      gradientDirection: gradientDirection.value,
      stroke: stroke.value,
      rounded: rounded.value,
      reflection: reflection.value,
      peakCaps: peakCaps.value,
      barCount: barCount.value,
      sensitivity: sensitivity.value,
    }))

    function applyPreset(id: string) {
      const preset = spectrumPresets.find((p) => p.id === id)
      if (!preset) return
      presetId.value = id
      colors.value = [...preset.colors]
      followCover.value = false
    }

    function setColor(index: number, color: string) {
      const next = [...colors.value] as SpectrumColors
      next[index] = color
      colors.value = next
      presetId.value = null
      followCover.value = false
    }

    return {
      mode,
      layout,
      colors,
      presetId,
      followCover,
      gradient,
      gradientDirection,
      stroke,
      rounded,
      reflection,
      peakCaps,
      barCount,
      sensitivity,
      options,
      applyPreset,
      setColor,
    }
  },
  { persist: { pick: PERSISTED_KEYS } },
)
