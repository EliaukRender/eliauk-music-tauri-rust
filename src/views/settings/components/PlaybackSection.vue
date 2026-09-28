<script setup lang="ts">
import { storeToRefs } from 'pinia'

import { SoundLevel } from '@/constants/player'
import { usePlayerStore } from '@/stores/player'
import { useSettingsStore } from '@/stores/settings'

const { level } = storeToRefs(usePlayerStore())
const { unblockEnabled } = storeToRefs(useSettingsStore())

const levelOptions = [
  { label: '标准', value: SoundLevel.Standard },
  { label: '较高', value: SoundLevel.Higher },
  { label: '极高（HQ）', value: SoundLevel.ExHigh },
  { label: '无损（SQ）', value: SoundLevel.Lossless },
  { label: 'Hi-Res', value: SoundLevel.HiRes },
]
</script>

<template>
  <n-card title="播放" size="small">
    <n-form-item label="音质" label-placement="left" :show-feedback="false">
      <div class="flex items-center gap-3">
        <n-select v-model:value="level" :options="levelOptions" class="w-40!" />
        <span class="text-xs text-muted">实际音质受账号权限和歌曲版本限制，接口会自动降级</span>
      </div>
    </n-form-item>
    <n-form-item label="解灰" label-placement="left" :show-feedback="false" class="mt-3">
      <div class="flex items-center gap-3">
        <n-switch v-model:value="unblockEnabled" />
        <span class="text-xs text-muted">
          无版权歌曲尝试从第三方音源匹配播放。音源不受本应用控制，可能存在版权风险，请自行判断；第三方音源的歌曲没有频谱
        </span>
      </div>
    </n-form-item>
  </n-card>
</template>
