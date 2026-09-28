import { useEventListener } from '@vueuse/core'
import type { MaybeRefOrGetter } from 'vue'

/** Windows 鼠标只有纵向滚轮：横向滚动容器内把 deltaY 转成横向滚动；触控板有 deltaX 时不干预 */
export function useHorizontalWheel(target: MaybeRefOrGetter<HTMLElement | null | undefined>) {
  useEventListener(
    target,
    'wheel',
    (event: WheelEvent) => {
      const el = event.currentTarget as HTMLElement
      if (event.deltaX !== 0 || el.scrollWidth <= el.clientWidth) return
      const atStart = el.scrollLeft <= 0 && event.deltaY < 0
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1 && event.deltaY > 0
      // 到达两端时放行，让外层页面继续纵向滚动
      if (atStart || atEnd) return
      event.preventDefault()
      el.scrollLeft += event.deltaY
    },
    { passive: false },
  )
}
