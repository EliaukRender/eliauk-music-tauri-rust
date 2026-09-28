import type { Component } from 'vue'

import IconBarChart from '~icons/ri/bar-chart-2-line'
import IconCompass from '~icons/ri/compass-3-line'
import IconHeart from '~icons/ri/heart-3-line'
import IconMic from '~icons/ri/mic-line'
import IconPlaylist from '~icons/ri/play-list-2-line'

import { RouteName, type RouteNameValue } from './route'

export type MenuItem = {
  name: RouteNameValue
  label: string
  icon: Component
}

export type MenuGroup = {
  title: string
  items: MenuItem[]
}

export const sideMenuGroups: MenuGroup[] = [
  {
    title: '在线音乐',
    items: [
      { name: RouteName.Discover, label: '发现音乐', icon: IconCompass },
      { name: RouteName.Toplist, label: '排行榜', icon: IconBarChart },
      { name: RouteName.Artist, label: '歌手', icon: IconMic },
    ],
  },
  {
    title: '我的音乐',
    items: [
      { name: RouteName.LikedSongs, label: '我喜欢的音乐', icon: IconHeart },
      { name: RouteName.MyPlaylist, label: '我的歌单', icon: IconPlaylist },
    ],
  },
]
