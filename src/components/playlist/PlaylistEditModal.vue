<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import { playlistEditor } from '@/composables/usePlaylistActions'
import { notify } from '@/services/notify'
import { usePlaylistStore } from '@/stores/playlist'

const store = usePlaylistStore()

const name = ref('')
const privacy = ref(false)
const submitting = ref(false)

const isRename = computed(() => !!playlistEditor.target)
const trimmed = computed(() => name.value.trim())

watch(
  () => playlistEditor.visible,
  (visible) => {
    if (!visible) return
    name.value = playlistEditor.target?.name ?? ''
    privacy.value = false
  },
)

async function submit() {
  if (!trimmed.value || submitting.value) return
  submitting.value = true
  try {
    if (playlistEditor.target) {
      await store.rename(playlistEditor.target.id, trimmed.value)
      notify.success('已重命名')
    } else {
      await store.create(trimmed.value, privacy.value)
      notify.success('已新建歌单')
    }
    playlistEditor.visible = false
  } catch (error) {
    notify.error(`${isRename.value ? '重命名' : '新建'}失败：${(error as Error).message}`)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <n-modal
    v-model:show="playlistEditor.visible"
    preset="card"
    :title="isRename ? '重命名歌单' : '新建歌单'"
    :bordered="false"
    class="w-[400px]!"
  >
    <n-input
      v-model:value="name"
      placeholder="歌单名称"
      :maxlength="40"
      show-count
      @keydown.enter="submit"
    />
    <n-checkbox v-if="!isRename" v-model:checked="privacy" class="mt-3">设为隐私歌单</n-checkbox>
    <template #footer>
      <div class="flex justify-end gap-2">
        <n-button @click="playlistEditor.visible = false">取消</n-button>
        <n-button type="primary" :disabled="!trimmed" :loading="submitting" @click="submit">
          {{ isRename ? '保存' : '新建' }}
        </n-button>
      </div>
    </template>
  </n-modal>
</template>
