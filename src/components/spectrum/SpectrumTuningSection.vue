<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed } from 'vue'

import {
  BAR_COUNT_MAX,
  BAR_COUNT_MIN,
  BAR_COUNT_STEP,
  GradientDirection,
  SENSITIVITY_MAX,
  SENSITIVITY_MIN,
  type SpectrumFeatures,
  spectrumFeatures,
  SpectrumMode,
} from '@/constants/spectrum'
import { useSpectrumStore } from '@/stores/spectrum'

const {
  mode,
  barCount,
  stroke,
  sensitivity,
  gradient,
  gradientDirection,
  rounded,
  reflection,
  peakCaps,
} = storeToRefs(useSpectrumStore())

const NO_FEATURES: SpectrumFeatures = {
  bands: false,
  bars: false,
  peakCaps: false,
  reflection: false,
  layout: false,
}
const features = computed(() =>
  mode.value === SpectrumMode.None ? NO_FEATURES : spectrumFeatures[mode.value],
)
const off = computed(() => mode.value === SpectrumMode.None)
/** 柱状样式下是柱宽，曲线和波形样式下是线宽 */
const strokeLabel = computed(() => (features.value.bars ? '柱宽' : '线宽'))
</script>

<template>
  <section class="grid grid-cols-[56px_1fr] items-center gap-x-3 gap-y-3">
    <span class="text-xs text-muted">柱数</span>
    <n-slider
      v-model:value="barCount"
      :min="BAR_COUNT_MIN"
      :max="BAR_COUNT_MAX"
      :step="BAR_COUNT_STEP"
      :disabled="!features.bands"
    />
    <span class="text-xs text-muted">{{ strokeLabel }}</span>
    <n-slider v-model:value="stroke" :min="1" :max="6" :step="1" :disabled="off" />
    <span class="text-xs text-muted">灵敏度</span>
    <n-slider
      v-model:value="sensitivity"
      :min="SENSITIVITY_MIN"
      :max="SENSITIVITY_MAX"
      :step="1"
      :disabled="!features.bands"
    />
    <span class="text-xs text-muted">渐变</span>
    <div class="flex items-center gap-3">
      <n-switch v-model:value="gradient" size="small" :disabled="off" />
      <n-radio-group v-model:value="gradientDirection" size="small" :disabled="off || !gradient">
        <n-radio-button :value="GradientDirection.Horizontal">水平</n-radio-button>
        <n-radio-button :value="GradientDirection.Vertical">垂直</n-radio-button>
      </n-radio-group>
    </div>
  </section>

  <section class="grid grid-cols-3 gap-2 text-xs text-muted">
    <label class="flex items-center gap-1.5">
      <n-switch v-model:value="rounded" size="small" :disabled="!features.bars" />
      圆角
    </label>
    <label class="flex items-center gap-1.5">
      <n-switch v-model:value="reflection" size="small" :disabled="!features.reflection" />
      倒影
    </label>
    <label class="flex items-center gap-1.5">
      <n-switch v-model:value="peakCaps" size="small" :disabled="!features.peakCaps" />
      峰值帽
    </label>
  </section>
</template>
