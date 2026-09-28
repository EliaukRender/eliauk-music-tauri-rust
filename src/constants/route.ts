export const RouteName = {
  Discover: 'discover',
  Playlist: 'playlist',
  Toplist: 'toplist',
  Artist: 'artist',
  ArtistDetail: 'artist-detail',
  Settings: 'settings',
} as const

export type RouteNameValue = (typeof RouteName)[keyof typeof RouteName]
