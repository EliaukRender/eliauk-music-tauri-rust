<script setup lang="ts">
import { storeToRefs } from 'pinia'

import { FFT_SIZES, spectrumModes, spectrumPresets } from '@/constants/spectrum'
import { useSpectrumStore } from '@/stores/spectrum'

const store = useSpectrumStore()
const { mode, colors, presetId, stroke, fftSize, gradient } = storeToRefs(store)

const fftOptions = FFT_SIZES.map((size) => ({ label: String(size), value: size }))
</script>

<template>
  <div class="w-[300px] space-y-4 py-1 text-sm">
    <section>
      <h4 class="mb-2 text-xs text-muted">样式</h4>
      <n-radio-group v-model:value="mode" size="small">
        <n-radio-button v-for="item in spectrumModes" :key="item.mode" :value="item.mode">
          {{ item.label }}
        </n-radio-button>
      </n-radio-group>
    </section>

    <section>
      <h4 class="mb-2 text-xs text-muted">配色</h4>
      <div class="grid grid-cols-4 gap-2">
        <button
          v-for="preset in spectrumPresets"
          :key="preset.id"
          class="h-5 rounded ring-offset-2 ring-offset-surface"
          :class="{ 'ring-2 ring-primary': presetId === preset.id }"
          :style="{ background: `linear-gradient(90deg, ${preset.colors.join(',')})` }"
          :title="`预设 ${preset.id}`"
          @click="store.applyPreset(preset.id)"
        />
      </div>
      <div class="mt-3 flex items-center gap-2">
        <span class="text-xs text-muted">自定义</span>
        <n-color-picker
          v-for="(color, index) in colors"
          :key="index"
          :value="color"
          :show-alpha="false"
          :modes="['hex']"
          size="small"
          :render-label="() => ''"
          class="w-9!"
          @update:value="(value: string) => store.setColor(index, value)"
        />
      </div>
    </section>

    <section class="grid grid-cols-[56px_1fr] items-center gap-x-3 gap-y-3">
      <span class="text-xs text-muted">柱宽</span>
      <n-slider v-model:value="stroke" :min="1" :max="6" :step="1" />
      <span class="text-xs text-muted">灵敏度</span>
      <n-select v-model:value="fftSize" :options="fftOptions" size="small" />
      <span class="text-xs text-muted">渐变</span>
      <n-switch v-model:value="gradient" size="small" />
    </section>
  </div>
</template>
