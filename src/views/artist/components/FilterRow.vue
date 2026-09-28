<script setup lang="ts" generic="T extends string | number">
defineProps<{ label: string; options: { label: string; value: T }[] }>()
const model = defineModel<T>({ required: true })
</script>

<template>
  <div class="flex items-start gap-3 text-sm">
    <span class="w-10 shrink-0 pt-1 text-muted">{{ label }}</span>
    <div class="flex flex-wrap gap-1">
      <button
        v-for="option in options"
        :key="option.value"
        class="rounded-full px-2.5 py-0.5 transition-colors"
        :class="
          model === option.value
            ? 'bg-primary/10 font-medium text-primary'
            : 'hover:bg-black/4 dark:hover:bg-white/6'
        "
        @click="model = option.value"
      >
        {{ option.label }}
      </button>
    </div>
  </div>
</template>
