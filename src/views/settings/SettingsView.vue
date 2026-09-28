<script setup lang="ts">
import { getVersion } from '@tauri-apps/api/app'
import { isTauri } from '@tauri-apps/api/core'
import { useMessage } from 'naive-ui'
import { storeToRefs } from 'pinia'
import { onMounted, ref } from 'vue'

import { fetchBanners } from '@/api/modules/recommend'
import ShortcutRecorder from '@/components/common/ShortcutRecorder.vue'
import { appHotkeys, type GlobalAction, globalActionLabels } from '@/constants/hotkeys'
import { SoundLevel } from '@/constants/player'
import { type ApiEndpoint, resolveApiEndpoint } from '@/services/tauri/api-endpoint'
import { useAppStore } from '@/stores/app'
import { usePlayerStore } from '@/stores/player'
import { useSettingsStore } from '@/stores/settings'
import { useUserStore } from '@/stores/user'
import { formatHotkey } from '@/utils/hotkey'
import { currentPlatform, isDesktop, usesCommandKey } from '@/utils/platform'

const message = useMessage()
const { themeMode } = storeToRefs(useAppStore())
const settings = useSettingsStore()
const { closeBehavior, globalShortcutsEnabled, globalShortcuts, unblockEnabled } =
  storeToRefs(settings)
const globalActions = Object.keys(globalActionLabels) as GlobalAction[]
const { level } = storeToRefs(usePlayerStore())
const user = useUserStore()
const { profile, isLoggedIn, isVip } = storeToRefs(user)

const levelOptions = [
  { label: '标准', value: SoundLevel.Standard },
  { label: '较高', value: SoundLevel.Higher },
  { label: '极高（HQ）', value: SoundLevel.ExHigh },
  { label: '无损（SQ）', value: SoundLevel.Lossless },
  { label: 'Hi-Res', value: SoundLevel.HiRes },
]

const appVersion = ref('-')
const endpoint = ref<ApiEndpoint | null>(null)
const endpointError = ref('')
const testing = ref(false)

const closeOptions = [
  { label: '最小化到系统托盘', value: 'minimize' },
  { label: '退出应用', value: 'exit' },
]

const themeOptions = [
  { label: '跟随系统', value: 'system' },
  { label: '浅色', value: 'light' },
  { label: '深色', value: 'dark' },
]

onMounted(async () => {
  if (isTauri()) appVersion.value = await getVersion()
  try {
    endpoint.value = await resolveApiEndpoint()
  } catch (error) {
    endpointError.value = (error as Error).message
  }
})

async function testConnection() {
  testing.value = true
  const start = performance.now()
  try {
    await fetchBanners()
    message.success(`连接正常，耗时 ${Math.round(performance.now() - start)}ms`)
  } catch (error) {
    message.error(`连接失败：${(error as Error).message}`)
  } finally {
    testing.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-3xl space-y-6">
    <h1 class="text-xl font-semibold">设置</h1>

    <n-card title="外观" size="small">
      <n-form-item label="主题" label-placement="left" :show-feedback="false">
        <n-radio-group v-model:value="themeMode">
          <n-radio-button v-for="opt in themeOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </n-radio-button>
        </n-radio-group>
      </n-form-item>
    </n-card>

    <n-card title="账号" size="small">
      <div v-if="isLoggedIn && profile" class="flex items-center gap-3">
        <n-avatar round :size="40" :src="profile.avatarUrl" />
        <div class="flex-1">
          <p class="flex items-center gap-2 text-sm">
            {{ profile.nickname }}
            <n-tag v-if="isVip" size="tiny" type="primary" :bordered="false">VIP</n-tag>
          </p>
          <p class="text-xs text-muted">UID {{ profile.userId }}</p>
        </div>
        <n-button size="small" @click="user.logout()">退出登录</n-button>
      </div>
      <p v-else class="text-sm text-muted">未登录，点击右上角「未登录」扫码登录</p>
    </n-card>

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

    <n-card title="快捷键" size="small">
      <div class="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
        <div v-for="hotkey in appHotkeys" :key="hotkey.action" class="flex justify-between">
          <span class="text-muted">{{ hotkey.label }}</span>
          <kbd class="rounded bg-elevated px-1.5 font-sans text-xs leading-5 ring-1 ring-line">
            {{
              formatHotkey(
                usesCommandKey ? (hotkey.macKeys ?? hotkey.keys) : hotkey.keys,
                usesCommandKey,
              )
            }}
          </kbd>
        </div>
      </div>
    </n-card>

    <n-card v-if="isDesktop" title="全局快捷键" size="small">
      <template #header-extra>
        <n-switch v-model:value="globalShortcutsEnabled" size="small" />
      </template>
      <p class="mb-3 text-xs text-muted">应用在后台时也能响应，默认关闭以免与其他软件冲突</p>
      <div class="space-y-2 text-sm">
        <div
          v-for="action in globalActions"
          :key="action"
          class="flex items-center justify-between"
        >
          <span class="text-muted">{{ globalActionLabels[action] }}</span>
          <ShortcutRecorder v-model="globalShortcuts[action]" :disabled="!globalShortcutsEnabled" />
        </div>
      </div>
      <template #action>
        <n-button
          size="small"
          :disabled="!globalShortcutsEnabled"
          @click="settings.resetGlobalShortcuts()"
        >
          恢复默认
        </n-button>
      </template>
    </n-card>

    <n-card v-if="isDesktop" title="窗口" size="small">
      <n-form-item label="点击关闭按钮时" label-placement="left" :show-feedback="false">
        <n-radio-group v-model:value="closeBehavior">
          <n-radio v-for="opt in closeOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </n-radio>
        </n-radio-group>
      </n-form-item>
    </n-card>

    <n-card title="音乐服务" size="small">
      <n-descriptions :column="1" label-placement="left" size="small">
        <n-descriptions-item label="接入形态">
          <n-tag
            v-if="endpoint"
            size="small"
            :type="endpoint.mode === 'embedded' ? 'success' : 'info'"
          >
            {{ endpoint.mode === 'embedded' ? '内嵌服务' : '远程服务' }}
          </n-tag>
          <span v-else class="text-muted">{{ endpointError || '检测中…' }}</span>
        </n-descriptions-item>
        <n-descriptions-item label="服务地址">
          <code class="text-xs">{{ endpoint?.baseUrl ?? '-' }}</code>
        </n-descriptions-item>
      </n-descriptions>
      <template #action>
        <n-button size="small" :loading="testing" :disabled="!endpoint" @click="testConnection">
          测试连接
        </n-button>
      </template>
    </n-card>

    <n-card title="关于" size="small">
      <n-descriptions :column="1" label-placement="left" size="small">
        <n-descriptions-item label="版本">{{ appVersion }}</n-descriptions-item>
        <n-descriptions-item label="平台">{{ currentPlatform }}</n-descriptions-item>
      </n-descriptions>
    </n-card>
  </div>
</template>
