export function formatPlayCount(count: number): string {
  if (count >= 100_000_000) return `${(count / 100_000_000).toFixed(1)}亿`
  if (count >= 10_000) return `${Math.floor(count / 10_000)}万`
  return String(count)
}

/** 秒 → m:ss，超过 1 小时为 h:mm:ss */
export function formatDuration(seconds: number): string {
  const total = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = String(total % 60).padStart(2, '0')
  return h ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`
}

export function joinArtists(artists: { name: string }[]): string {
  return artists.map((a) => a.name).join(' / ')
}

/** 网易云图片支持 param 参数按尺寸裁剪，避免加载原图 */
export function resizeImage(url: string, size: number): string {
  if (!url) return url
  return `${url}${url.includes('?') ? '&' : '?'}param=${size}y${size}`
}

const pad = (n: number) => String(n).padStart(2, '0')

/** 播放历史的时间：1 分钟内为「刚刚」，1 小时内为「N 分钟前」，之后按今天、昨天、今年、更早显示 */
export function formatPlayedAt(timestamp: number, now = Date.now()): string {
  const diff = now - timestamp
  if (diff < 60_000) return '刚刚'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`
  const date = new Date(timestamp)
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`
  if (timestamp >= today.getTime()) return time
  if (timestamp >= today.getTime() - 86_400_000) return `昨天 ${time}`
  const day = `${date.getMonth() + 1}月${date.getDate()}日`
  return date.getFullYear() === today.getFullYear() ? day : `${date.getFullYear()}年${day}`
}
