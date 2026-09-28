<script setup lang="ts">
import { useDocumentVisibility, useResizeObserver } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { onBeforeUnmount, onMounted, useTemplateRef, watch } from 'vue'

import { SpectrumMode } from '@/constants/spectrum'
import { audioEngine } from '@/services/player/audio-engine'
import { createSpectrumRenderer } from '@/services/spectrum/renderer'
import { usePlayerStore } from '@/stores/player'
import { useSpectrumStore } from '@/stores/spectrum'

const canvasRef = useTemplateRef<HTMLCanvasElement>('canvas')
const { options, mode } = storeToRefs(useSpectrumStore())
const { isPlaying } = storeToRefs(usePlayerStore())
const visibility = useDocumentVisibility()

let renderer: ReturnType<typeof createSpectrumRenderer> | null = null

onMounted(() => {
  renderer = createSpectrumRenderer(
    canvasRef.value!,
    () => audioEngine.getAnalyser(),
    options.value,
  )
  renderer.resize()
})
onBeforeUnmount(() => renderer?.stop())

useResizeObserver(canvasRef, () => renderer?.resize())

watch(options, (value) => renderer?.update(value))

// 暂停、页面不可见或关闭频谱时停止 rAF，CPU 占用回落
watch(
  [isPlaying, visibility, mode],
  ([playing, visible, currentMode]) => {
    if (!renderer) return
    if (playing && visible === 'visible' && currentMode !== SpectrumMode.None) renderer.start()
    else renderer.stop()
  },
  { flush: 'post' },
)
onMounted(() => {
  if (isPlaying.value && mode.value !== SpectrumMode.None) renderer?.start()
})
</script>

<template>
  <canvas ref="canvas" class="pointer-events-none block size-full" />
</template>
