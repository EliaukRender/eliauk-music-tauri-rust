<script setup lang="ts">
import { storeToRefs } from 'pinia'

import { useUserStore } from '@/stores/user'

const user = useUserStore()
const { profile, isLoggedIn, isVip } = storeToRefs(user)
</script>

<template>
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
</template>
