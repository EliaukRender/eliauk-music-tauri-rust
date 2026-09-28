/** Windows 的页面源 http://tauri.localhost 不是安全上下文，navigator.clipboard 可能不可用 */
export async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return
    } catch {
      // 降级到 execCommand
    }
  }
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  try {
    if (!document.execCommand('copy')) throw new Error('复制失败')
  } finally {
    textarea.remove()
  }
}
