/** 跨窗口传输的精简歌曲信息 */
export type MiniSong = {
  id: number
  name: string
  artist: string
  cover: string
}

export type MiniPlayerState = {
  song: MiniSong | null
  isPlaying: boolean
  liked: boolean
  /** 未登录时不显示喜欢按钮 */
  loggedIn: boolean
}
