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
