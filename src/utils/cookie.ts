/** 接口实际依赖的字段；Windows 凭据管理器单条上限 2560 字节，不能存整串 Set-Cookie */
const KEPT_COOKIE_KEYS = ['MUSIC_U', '__csrf', 'NMTID']

/**
 * 登录接口返回的是多条 Set-Cookie 拼接的字符串，夹杂 Max-Age、Path 等属性，
 * 只保留需要的键值对
 */
export function compactCookie(raw: string): string {
  const pairs = new Map<string, string>()
  for (const part of raw.split(';')) {
    const index = part.indexOf('=')
    if (index <= 0) continue
    const key = part.slice(0, index).trim()
    const value = part.slice(index + 1).trim()
    if (KEPT_COOKIE_KEYS.includes(key) && value) pairs.set(key, value)
  }
  return [...pairs].map(([key, value]) => `${key}=${value}`).join('; ')
}
