import type { Component } from 'vue'

import IconBarChart from '~icons/ri/bar-chart-2-line'
import IconCompass from '~icons/ri/compass-3-line'
import IconMic from '~icons/ri/mic-line'

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

/** 静态菜单；「我的音乐」依赖登录态，由 SideMenu 动态渲染 */
export const sideMenuGroups: MenuGroup[] = [
  {
    title: '在线音乐',
    items: [
      { name: RouteName.Discover, label: '发现音乐', icon: IconCompass },
      { name: RouteName.Toplist, label: '排行榜', icon: IconBarChart },
      { name: RouteName.Artist, label: '歌手', icon: IconMic },
    ],
  },
]
