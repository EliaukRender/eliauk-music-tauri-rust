<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed } from 'vue'

import {
  spectrumFeatures,
  spectrumLayouts,
  SpectrumMode,
  spectrumModes,
} from '@/constants/spectrum'
import { useSpectrumStore } from '@/stores/spectrum'

const { mode, layout } = storeToRefs(useSpectrumStore())

const layoutDisabled = computed(
  () => mode.value === SpectrumMode.None || !spectrumFeatures[mode.value].layout,
)
</script>

<template>
  <section>
    <h4 class="mb-2 text-xs text-muted">样式</h4>
    <div class="grid grid-cols-4 gap-1.5">
      <n-button
        v-for="item in spectrumModes"
        :key="item.mode"
        size="small"
        :type="mode === item.mode ? 'primary' : 'default'"
        :secondary="mode !== item.mode"
        @click="mode = item.mode"
      >
        {{ item.label }}
      </n-button>
    </div>
    <p v-if="mode === SpectrumMode.Ring" class="mt-1.5 text-xs text-muted">
      环形样式围绕全屏歌词页的唱片显示
    </p>
  </section>

  <section>
    <h4 class="mb-2 text-xs text-muted">布局</h4>
    <n-radio-group v-model:value="layout" size="small" :disabled="layoutDisabled">
      <n-radio-button v-for="item in spectrumLayouts" :key="item.layout" :value="item.layout">
        {{ item.label }}
      </n-radio-button>
    </n-radio-group>
  </section>
</template>
