<script setup lang="ts">
import { useAsyncState } from '@vueuse/core'
import { computed } from 'vue'

import { fetchToplists } from '@/api/modules/toplist'
import PlaylistCard from '@/components/common/PlaylistCard.vue'

import OfficialToplistCard from './components/OfficialToplistCard.vue'

defineOptions({ name: 'ToplistView' })

const { state, isLoading, error, execute } = useAsyncState(fetchToplists, [])

const official = computed(() => state.value.filter((t) => t.official))
const others = computed(() => state.value.filter((t) => !t.official))
</script>

<template>
  <div class="mx-auto max-w-[1280px]">
    <h1 class="pt-2 pb-5 text-xl font-semibold">排行榜</h1>

    <n-result
      v-if="error && !state.length"
      status="warning"
      title="排行榜加载失败"
      :description="(error as Error).message"
      class="py-24"
    >
      <template #footer>
        <n-button type="primary" @click="execute()">重新加载</n-button>
      </template>
    </n-result>

    <template v-else>
      <h2 class="mb-3 text-base font-semibold">官方榜</h2>
      <div class="grid grid-cols-[repeat(auto-fill,minmax(360px,1fr))] gap-4">
        <template v-if="isLoading && !state.length">
          <n-skeleton v-for="n in 4" :key="n" height="144px" class="rounded-2xl" />
        </template>
        <OfficialToplistCard v-for="item in official" v-else :key="item.id" :toplist="item" />
      </div>

      <h2 class="mt-10 mb-4 text-base font-semibold">更多榜单</h2>
      <div class="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-5">
        <PlaylistCard
          v-for="item in others"
          :key="item.id"
          :playlist="{
            id: item.id,
            name: item.name,
            picUrl: item.coverImgUrl,
            playCount: item.playCount,
          }"
          :subtitle="item.updateFrequency"
        />
      </div>
    </template>
  </div>
</template>
