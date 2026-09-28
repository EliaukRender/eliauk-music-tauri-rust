/** /artist/list 的筛选参数 */
export const artistTypeOptions = [
  { label: '全部', value: -1 },
  { label: '男歌手', value: 1 },
  { label: '女歌手', value: 2 },
  { label: '乐队', value: 3 },
]

export const artistAreaOptions = [
  { label: '全部', value: -1 },
  { label: '华语', value: 7 },
  { label: '欧美', value: 96 },
  { label: '日本', value: 8 },
  { label: '韩国', value: 16 },
  { label: '其他', value: 0 },
]

/** -1 为热门，0 为 # */
export const artistInitialOptions = [
  { label: '热门', value: '-1' },
  ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((c) => ({ label: c, value: c.toLowerCase() })),
  { label: '#', value: '0' },
]

export type ArtistFilter = { type: number; area: number; initial: string }

export const ARTIST_PAGE_SIZE = 30
