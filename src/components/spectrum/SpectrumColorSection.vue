<script setup lang="ts">
import { storeToRefs } from 'pinia'

import { useCoverPalette } from '@/composables/useCoverPalette'
import { spectrumPresets } from '@/constants/spectrum'
import { useSpectrumStore } from '@/stores/spectrum'

const store = useSpectrumStore()
const { colors, presetId, followCover } = storeToRefs(store)
const coverPalette = useCoverPalette(followCover)
</script>

<template>
  <section>
    <div class="mb-2 flex items-center justify-between">
      <h4 class="text-xs text-muted">配色</h4>
      <label class="flex items-center gap-1.5 text-xs text-muted">
        跟随封面
        <n-switch v-model:value="followCover" size="small" />
      </label>
    </div>
    <div
      v-if="followCover"
      class="mb-2 h-5 rounded"
      :style="{ background: `linear-gradient(90deg, ${(coverPalette ?? colors).join(',')})` }"
      :title="coverPalette ? '当前封面配色' : '封面取色失败或为黑白封面，使用下方配色'"
    />
    <div class="grid grid-cols-4 gap-2" :class="{ 'opacity-50': followCover }">
      <button
        v-for="preset in spectrumPresets"
        :key="preset.id"
        class="h-5 rounded ring-offset-2 ring-offset-surface"
        :class="{ 'ring-2 ring-primary': !followCover && presetId === preset.id }"
        :style="{ background: `linear-gradient(90deg, ${preset.colors.join(',')})` }"
        :title="`预设 ${preset.id}`"
        @click="store.applyPreset(preset.id)"
      />
    </div>
    <div class="mt-3 flex items-center gap-2" :class="{ 'opacity-50': followCover }">
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
</template>
