import { isTauri } from '@tauri-apps/api/core'
import { platform as tauriPlatform } from '@tauri-apps/plugin-os'

export type AppPlatform = 'macos' | 'windows' | 'linux' | 'web'

function detect(): AppPlatform {
  if (!isTauri()) return 'web'
  const name = tauriPlatform()
  return name === 'macos' || name === 'windows' ? name : 'linux'
}

/** 运行期不变，模块加载时计算一次 */
export const currentPlatform: AppPlatform = detect()
export const isMacOS = currentPlatform === 'macos'
export const isWindows = currentPlatform === 'windows'
export const isDesktop = currentPlatform !== 'web'

/** 快捷键的 Mod 键：浏览器调试时按 UA 判断 */
export const usesCommandKey =
  isMacOS || (currentPlatform === 'web' && /Mac|iPhone|iPad/i.test(navigator.userAgent))
