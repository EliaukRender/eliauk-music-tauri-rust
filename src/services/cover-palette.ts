import { resizeImage } from '@/utils/format'

const SAMPLE_SIZE = 32
const HUE_BUCKETS = 12
/** 低于该饱和度视为灰色，不参与取色 */
const MIN_SATURATION = 0.15
const CACHE_LIMIT = 50
/** 频谱与歌词背景都在深色底上，取出的颜色提亮到该区间以保证可见 */
const MIN_LIGHTNESS = 0.55
const MAX_LIGHTNESS = 0.8
const MIN_OUTPUT_SATURATION = 0.45
/** 彩色像素的平均权重低于该值视为黑白封面 */
const MIN_COLORFUL_WEIGHT = 0.02

export type CoverPalette = [string, string, string, string]

type Hsl = [h: number, s: number, l: number]

function rgbToHsl(r: number, g: number, b: number): Hsl {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  const d = max - min
  if (!d) return [0, 0, l]
  const s = d / (1 - Math.abs(2 * l - 1))
  let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  h = (h * 60 + 360) % 360
  return [h, s, l]
}

function hslToHex([h, s, l]: Hsl) {
  const a = s * Math.min(l, 1 - l)
  const channel = (n: number) => {
    const k = (n + h / 30) % 12
    const v = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))
    return Math.round(v * 255)
      .toString(16)
      .padStart(2, '0')
  }
  return `#${channel(0)}${channel(8)}${channel(4)}`
}

/**
 * 从 RGBA 像素中按色相分桶，取权重最高的 4 个色相作为配色；
 * 权重偏向饱和、中等亮度的像素。几乎没有彩色像素（黑白封面）时返回 null
 */
export function pickPalette(pixels: Uint8ClampedArray): CoverPalette | null {
  const buckets = Array.from({ length: HUE_BUCKETS }, () => ({
    weight: 0,
    cos: 0,
    sin: 0,
    s: 0,
    l: 0,
  }))
  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i + 3]! < 128) continue
    const [h, s, l] = rgbToHsl(pixels[i]!, pixels[i + 1]!, pixels[i + 2]!)
    if (s < MIN_SATURATION || l < 0.1 || l > 0.95) continue
    const weight = s * (1 - Math.abs(l - 0.5))
    const bucket = buckets[Math.floor(h / (360 / HUE_BUCKETS)) % HUE_BUCKETS]!
    const rad = (h * Math.PI) / 180
    bucket.weight += weight
    // 色相按向量平均，避免 350° 与 10° 平均成 180°
    bucket.cos += Math.cos(rad) * weight
    bucket.sin += Math.sin(rad) * weight
    bucket.s += s * weight
    bucket.l += l * weight
  }
  const ranked = buckets.filter((b) => b.weight > 0).sort((a, b) => b.weight - a.weight)
  const total = ranked.reduce((sum, b) => sum + b.weight, 0)
  if (!ranked.length || total < (pixels.length / 4) * MIN_COLORFUL_WEIGHT) return null

  const colors: Hsl[] = ranked
    .slice(0, 4)
    .map((b) => [
      ((Math.atan2(b.sin, b.cos) * 180) / Math.PI + 360) % 360,
      Math.max(b.s / b.weight, MIN_OUTPUT_SATURATION),
      Math.min(Math.max(b.l / b.weight, MIN_LIGHTNESS), MAX_LIGHTNESS),
    ])
  // 色相不足 4 种时，用已有颜色的不同明度补齐
  const base = colors.length
  for (let i = base; i < 4; i++) {
    const [h, s, l] = colors[i % base]!
    colors.push([h, s, i % 2 ? Math.min(l + 0.12, 0.9) : Math.max(l - 0.1, 0.45)])
  }
  return colors.map(hslToHex) as CoverPalette
}

const cache = new Map<string, Promise<CoverPalette | null>>()

function loadPixels(url: string) {
  return new Promise<Uint8ClampedArray>((resolve, reject) => {
    const img = new Image()
    // 封面 CDN 返回 Access-Control-Allow-Origin: *，否则 getImageData 会因画布被污染而抛错
    img.crossOrigin = 'anonymous'
    img.decoding = 'async'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = canvas.height = SAMPLE_SIZE
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!
      ctx.drawImage(img, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE)
      resolve(ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE).data)
    }
    img.onerror = () => reject(new Error(`封面加载失败：${url}`))
    img.src = resizeImage(url.replace(/^http:\/\//, 'https://'), 64)
  })
}

/** 提取封面配色，按 URL 缓存；失败或黑白封面返回 null */
export function extractCoverPalette(url: string): Promise<CoverPalette | null> {
  const cached = cache.get(url)
  if (cached) return cached
  const task = loadPixels(url)
    .then(pickPalette)
    .catch((error: unknown) => {
      console.warn('[cover-palette] 封面取色失败', error)
      cache.delete(url)
      return null
    })
  if (cache.size >= CACHE_LIMIT) cache.delete(cache.keys().next().value!)
  cache.set(url, task)
  return task
}
