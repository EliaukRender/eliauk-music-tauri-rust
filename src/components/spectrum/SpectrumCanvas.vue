<script setup lang="ts">
import { useDocumentVisibility, useResizeObserver } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { computed, onBeforeUnmount, onMounted, useTemplateRef, watch } from 'vue'

import { useCoverPalette } from '@/composables/useCoverPalette'
import { SpectrumMode } from '@/constants/spectrum'
import { audioEngine } from '@/services/player/audio-engine'
import { createSpectrumRenderer } from '@/services/spectrum/renderer'
import { usePlayerStore } from '@/stores/player'
import { useSpectrumStore } from '@/stores/spectrum'

const canvasRef = useTemplateRef<HTMLCanvasElement>('canvas')
const { options, mode, followCover } = storeToRefs(useSpectrumStore())
const { isPlaying, unblocked } = storeToRefs(usePlayerStore())
const visibility = useDocumentVisibility()
const coverPalette = useCoverPalette(followCover)

const renderOptions = computed(() =>
  coverPalette.value ? { ...options.value, colors: coverPalette.value } : options.value,
)

let renderer: ReturnType<typeof createSpectrumRenderer> | null = null

onMounted(() => {
  renderer = createSpectrumRenderer(
    canvasRef.value!,
    () => audioEngine.getAnalyser(),
    renderOptions.value,
  )
  renderer.resize()
})
onBeforeUnmount(() => renderer?.halt())

useResizeObserver(canvasRef, () => renderer?.resize())

watch(renderOptions, (value) => renderer?.update(value))

// 暂停或切到第三方音源（没有 analyser）时让柱子落回底部再停 rAF；页面不可见或关闭频谱时立即停止
watch(
  [isPlaying, unblocked, visibility, mode],
  ([playing, thirdParty, visible, currentMode]) => {
    if (!renderer) return
    if (visible !== 'visible' || currentMode === SpectrumMode.None) renderer.halt()
    else if (playing && !thirdParty) renderer.start()
    else renderer.stop()
  },
  { flush: 'post' },
)
onMounted(() => {
  if (isPlaying.value && !unblocked.value && mode.value !== SpectrumMode.None) renderer?.start()
})
</script>

<template>
  <canvas ref="canvas" class="pointer-events-none block size-full" />
</template>
