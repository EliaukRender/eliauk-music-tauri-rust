export const RouteName = {
  Discover: 'discover',
  Playlist: 'playlist',
  Toplist: 'toplist',
  Artist: 'artist',
  ArtistDetail: 'artist-detail',
  Search: 'search',
  Settings: 'settings',
} as const

export type RouteNameValue = (typeof RouteName)[keyof typeof RouteName]
