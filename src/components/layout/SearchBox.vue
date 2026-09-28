<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { fetchHotSearches, fetchSuggestions } from '@/api/modules/search'
import { RouteName } from '@/constants/route'

const route = useRoute()
const router = useRouter()

const keywords = ref('')
const hot = ref<string[]>([])
const suggestions = ref<string[]>([])
let suggestSeq = 0

// 进入搜索页（如前进后退）时回填关键词
watch(
  () => route.query.keywords,
  (value) => {
    if (route.name === RouteName.Search && typeof value === 'string') keywords.value = value
  },
  { immediate: true },
)

// NAutoComplete 固定高亮第一项，回车会选中它；把输入原文放在首位，回车才是搜索用户输入的内容
const options = computed(() => {
  const trimmed = keywords.value.trim()
  const list = trimmed ? [trimmed, ...suggestions.value.filter((w) => w !== trimmed)] : hot.value
  return list.map((word) => ({ label: word, value: word }))
})

const suggest = useDebounceFn(async (value: string) => {
  const seq = ++suggestSeq
  try {
    const result = await fetchSuggestions(value)
    if (seq === suggestSeq) suggestions.value = result
  } catch {
    // 联想失败不影响搜索
  }
}, 250)

function onInput(value: string) {
  keywords.value = value
  const trimmed = value.trim()
  if (trimmed) void suggest(trimmed)
  else suggestions.value = []
}

async function onFocus() {
  if (hot.value.length) return
  try {
    hot.value = (await fetchHotSearches()).slice(0, 10)
  } catch {
    // 热搜失败时不展示下拉
  }
}

function submit(value = keywords.value) {
  const trimmed = value.trim()
  if (!trimmed) return
  keywords.value = trimmed
  void router.push({ name: RouteName.Search, query: { ...route.query, keywords: trimmed } })
}
</script>

<template>
  <n-auto-complete
    :value="keywords"
    :options="options"
    :get-show="() => true"
    :input-props="{ autocomplete: 'off' }"
    placeholder="搜索音乐、歌手、歌单"
    round
    size="small"
    clearable
    class="max-w-64"
    @update:value="onInput"
    @select="(value: string | number) => submit(String(value))"
    @focus="onFocus"
    @keydown.enter="submit()"
  >
    <template #prefix><i-ri-search-line class="text-muted" /></template>
  </n-auto-complete>
</template>
