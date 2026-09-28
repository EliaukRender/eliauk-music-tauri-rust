<script setup lang="ts">
import type { DropdownOption } from 'naive-ui'
import { computed } from 'vue'

import { fallbackMenu } from '@/composables/useContextMenu'
import type { MenuAction } from '@/services/context-menu/types'

function toOptions(items: MenuAction[], prefix = ''): DropdownOption[] {
  return items.map((item, index) => {
    if (item.type === 'separator') return { type: 'divider', key: `${prefix}divider-${index}` }
    if (item.type === 'submenu') {
      return {
        key: `${prefix}${item.id}`,
        label: item.label,
        children: toOptions(item.items, `${item.id}/`),
      }
    }
    return { key: `${prefix}${item.id}`, label: item.label, disabled: item.enabled === false }
  })
}

function findAction(items: MenuAction[], key: string, prefix = ''): (() => void) | null {
  for (const item of items) {
    if (item.type === 'item' && `${prefix}${item.id}` === key) return item.action
    if (item.type === 'submenu') {
      const found = findAction(item.items, key, `${item.id}/`)
      if (found) return found
    }
  }
  return null
}

const options = computed(() => toOptions(fallbackMenu.items))

// 子菜单（如歌单列表）可能很长，原生菜单由系统滚动，这里需要自己限制高度；
// 只能加在子菜单上，根菜单设置 overflow 会把嵌在其中的子菜单裁掉
const menuProps = (option: DropdownOption | undefined) =>
  option ? { style: 'max-height: 60vh; overflow-y: auto' } : {}

function onSelect(key: string) {
  fallbackMenu.visible = false
  findAction(fallbackMenu.items, key)?.()
}
</script>

<template>
  <n-dropdown
    trigger="manual"
    placement="bottom-start"
    :show="fallbackMenu.visible"
    :x="fallbackMenu.x"
    :y="fallbackMenu.y"
    :options="options"
    :menu-props="menuProps"
    @select="onSelect"
    @clickoutside="fallbackMenu.visible = false"
  />
</template>
