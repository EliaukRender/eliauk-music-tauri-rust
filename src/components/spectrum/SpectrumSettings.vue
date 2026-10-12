<script setup lang="ts">
import SpectrumColorSection from './SpectrumColorSection.vue'
import SpectrumModeSection from './SpectrumModeSection.vue'
import SpectrumTuningSection from './SpectrumTuningSection.vue'
</script>

<template>
  <div class="w-[320px] space-y-4 py-1 text-sm">
    <SpectrumModeSection />
    <SpectrumColorSection />
    <SpectrumTuningSection />
  </div>
</template>
