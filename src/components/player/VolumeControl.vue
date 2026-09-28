<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed } from 'vue'

import { usePlayerStore } from '@/stores/player'

const player = usePlayerStore()
const { volume, muted } = storeToRefs(player)

const displayVolume = computed(() => (muted.value ? 0 : volume.value))
</script>

<template>
  <div class="flex items-center gap-2">
    <button class="hover:text-fg" :title="muted ? '取消静音' : '静音'" @click="player.toggleMute()">
      <i-ri-volume-mute-line v-if="displayVolume === 0" class="text-lg" />
      <i-ri-volume-down-line v-else-if="displayVolume < 50" class="text-lg" />
      <i-ri-volume-up-line v-else class="text-lg" />
    </button>
    <n-slider
      :value="displayVolume"
      :format-tooltip="(v: number) => `${v}%`"
      class="w-24!"
      @update:value="player.setVolume"
    />
  </div>
</template>
