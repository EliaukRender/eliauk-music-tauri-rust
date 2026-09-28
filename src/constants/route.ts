export const RouteName = {
  Discover: 'discover',
  Toplist: 'toplist',
  Artist: 'artist',
  LikedSongs: 'liked-songs',
  MyPlaylist: 'my-playlist',
  Settings: 'settings',
} as const

export type RouteNameValue = (typeof RouteName)[keyof typeof RouteName]
