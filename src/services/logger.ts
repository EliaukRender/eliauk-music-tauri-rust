import { isTauri } from '@tauri-apps/api/core'
import { info as logInfo, warn as logWarn } from '@tauri-apps/plugin-log'

/** Tauri 中写入日志文件（LogDir），浏览器调试时退化为 console */
export const logger = {
  info(message: string) {
    if (isTauri()) void logInfo(message)
    else console.info(message)
  },
  warn(message: string) {
    if (isTauri()) void logWarn(message)
    else console.warn(message)
  },
}
