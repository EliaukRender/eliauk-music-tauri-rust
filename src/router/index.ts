import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'

import { RouteName } from '@/constants/route'
import DefaultLayout from '@/layouts/DefaultLayout.vue'

const PlaceholderView = () => import('@/views/placeholder/PlaceholderView.vue')

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: DefaultLayout,
    redirect: { name: RouteName.Discover },
    children: [
      {
        path: 'discover',
        name: RouteName.Discover,
        component: () => import('@/views/discover/DiscoverView.vue'),
        meta: { title: '发现音乐' },
      },
      {
        path: 'playlist/:id(\\d+)',
        name: RouteName.Playlist,
        component: () => import('@/views/playlist/PlaylistDetailView.vue'),
        props: (route) => ({ id: Number(route.params.id) }),
        meta: { title: '歌单' },
      },
      {
        path: 'toplist',
        name: RouteName.Toplist,
        component: PlaceholderView,
        meta: { title: '排行榜', doc: '10-音乐馆.md' },
      },
      {
        path: 'artist',
        name: RouteName.Artist,
        component: PlaceholderView,
        meta: { title: '歌手', doc: '10-音乐馆.md' },
      },
      {
        path: 'settings',
        name: RouteName.Settings,
        component: () => import('@/views/settings/SettingsView.vue'),
        meta: { title: '设置' },
      },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

// Tauri 生产环境通过自定义协议加载静态资源，hash 模式无需服务端回退
export const router = createRouter({
  history: createWebHashHistory(),
  routes,
})
