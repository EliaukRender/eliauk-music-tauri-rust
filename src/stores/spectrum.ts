import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'

import {
  DEFAULT_FFT_SIZE,
  type FftSize,
  type SpectrumColors,
  SpectrumMode,
  spectrumPresets,
} from '@/constants/spectrum'
import { audioEngine } from '@/services/player/audio-engine'
import type { SpectrumOptions } from '@/services/spectrum/renderer'

export const useSpectrumStore = defineStore(
  'spectrum',
  () => {
    const mode = ref<SpectrumMode>(SpectrumMode.Bars)
    const colors = ref<SpectrumColors>([...spectrumPresets[0]!.colors])
    /** 选中预设时有值，自定义颜色时为 null */
    const presetId = ref<string | null>(spectrumPresets[0]!.id)
    /** 1-6 */
    const stroke = ref(3)
    const fftSize = ref<FftSize>(DEFAULT_FFT_SIZE)
    const gradient = ref(true)

    const options = computed<SpectrumOptions>(() => ({
      mode: mode.value,
      colors: colors.value,
      stroke: stroke.value,
      gradient: gradient.value,
    }))

    function applyPreset(id: string) {
      const preset = spectrumPresets.find((p) => p.id === id)
      if (!preset) return
      presetId.value = id
      colors.value = [...preset.colors]
    }

    function setColor(index: number, color: string) {
      const next = [...colors.value] as SpectrumColors
      next[index] = color
      colors.value = next
      presetId.value = null
    }

    watch(fftSize, (size) => audioEngine.setFftSize(size), { immediate: true })

    return { mode, colors, presetId, stroke, fftSize, gradient, options, applyPreset, setColor }
  },
  { persist: { pick: ['mode', 'colors', 'presetId', 'stroke', 'fftSize', 'gradient'] } },
)
