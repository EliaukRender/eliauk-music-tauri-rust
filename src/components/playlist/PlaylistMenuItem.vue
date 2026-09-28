<script setup lang="ts">
import { RouteName } from '@/constants/route'
import { usePlaylistMenu } from '@/features/context-menus'
import type { UserPlaylist } from '@/types/music'
import { resizeImage } from '@/utils/format'

defineProps<{ playlist: UserPlaylist }>()

const menu = usePlaylistMenu()
</script>

<template>
  <RouterLink
    v-slot="{ href, navigate, isActive }"
    :to="{ name: RouteName.Playlist, params: { id: playlist.id } }"
    custom
  >
    <a
      :href="href"
      draggable="false"
      class="flex h-9 items-center gap-2.5 rounded-lg px-3 text-sm transition-colors"
      :class="
        isActive
          ? 'bg-primary/10 font-medium text-primary'
          : 'text-fg hover:bg-black/4 dark:hover:bg-white/6'
      "
      :title="playlist.name"
      @click="navigate"
      @contextmenu="menu.open($event, playlist)"
    >
      <img
        :src="resizeImage(playlist.coverImgUrl, 40)"
        alt=""
        draggable="false"
        class="size-5 shrink-0 rounded object-cover"
      />
      <span class="truncate">{{ playlist.name }}</span>
    </a>
  </RouterLink>
</template>
