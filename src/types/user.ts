export type UserProfile = {
  userId: number
  nickname: string
  avatarUrl: string
  /** 0 为非会员 */
  vipType: number
}
