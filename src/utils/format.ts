export function formatPlayCount(count: number): string {
  if (count >= 100_000_000) return `${(count / 100_000_000).toFixed(1)}亿`
  if (count >= 10_000) return `${Math.floor(count / 10_000)}万`
  return String(count)
}

/** 网易云图片支持 param 参数按尺寸裁剪，避免加载原图 */
export function resizeImage(url: string, size: number): string {
  if (!url) return url
  return `${url}${url.includes('?') ? '&' : '?'}param=${size}y${size}`
}
