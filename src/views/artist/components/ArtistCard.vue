<script setup lang="ts">
import { RouteName } from '@/constants/route'
import type { ArtistSummary } from '@/types/music'
import { resizeImage } from '@/utils/format'

defineProps<{ artist: ArtistSummary }>()
</script>

<template>
  <RouterLink
    :to="{ name: RouteName.ArtistDetail, params: { id: artist.id } }"
    draggable="false"
    class="group flex flex-col items-center gap-2"
  >
    <div class="aspect-square w-full overflow-hidden rounded-full bg-elevated">
      <img
        :src="resizeImage(artist.avatar, 200)"
        :alt="artist.name"
        loading="lazy"
        draggable="false"
        class="size-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
    </div>
    <span class="w-full truncate text-center text-sm group-hover:text-primary">
      {{ artist.name }}
    </span>
  </RouterLink>
</template>
