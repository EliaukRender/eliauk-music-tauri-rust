<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import { RouteName } from '@/constants/route'
import { useUserStore } from '@/stores/user'
import { resizeImage } from '@/utils/format'

import LoginModal from './LoginModal.vue'

const router = useRouter()
const user = useUserStore()
const { profile, isLoggedIn } = storeToRefs(user)

const loginVisible = ref(false)

const menuOptions = [
  { label: '设置', key: 'settings' },
  { label: '退出登录', key: 'logout' },
]

function onSelect(key: string) {
  if (key === 'settings') void router.push({ name: RouteName.Settings })
  if (key === 'logout') void user.logout()
}
</script>

<template>
  <n-dropdown v-if="isLoggedIn && profile" :options="menuOptions" @select="onSelect">
    <button
      class="flex shrink-0 items-center gap-2 rounded-full py-0.5 pr-2 pl-0.5 whitespace-nowrap hover:bg-black/4 dark:hover:bg-white/6"
    >
      <n-avatar round :size="26" :src="resizeImage(profile.avatarUrl, 60)" />
      <span class="max-w-28 truncate text-sm">{{ profile.nickname }}</span>
    </button>
  </n-dropdown>
  <button
    v-else
    class="flex shrink-0 items-center gap-2 rounded-full py-0.5 pr-2 pl-0.5 text-sm whitespace-nowrap text-muted hover:bg-black/4 hover:text-fg dark:hover:bg-white/6"
    @click="loginVisible = true"
  >
    <span class="flex size-[26px] items-center justify-center rounded-full bg-elevated">
      <i-ri-user-3-line />
    </span>
    未登录
  </button>
  <LoginModal v-model:show="loginVisible" />
</template>
