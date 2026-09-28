<script setup lang="ts">
import { useMessage } from 'naive-ui'
import { onScopeDispose } from 'vue'

import { bindMessageApi } from '@/services/notify'

bindMessageApi(useMessage())
onScopeDispose(() => bindMessageApi(null))
</script>

<template>
  <slot />
</template>
