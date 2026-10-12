import { onScopeDispose, ref } from 'vue'

/** 指针距离容器上下边缘多少像素内开始自动滚动，以及最大速度（像素/帧） */
const EDGE = 48
const MAX_SPEED = 14

/**
 * 由指针在列表内容中的纵向偏移算出插入位置（0..count，表示插到第 slot 项之前）。
 * 返回拖放后被拖项的目标下标；位置不变时返回 null
 */
export function resolveDrop(offsetY: number, itemHeight: number, count: number, from: number) {
  const slot = Math.min(Math.max(Math.round(offsetY / itemHeight), 0), count)
  if (slot === from || slot === from + 1) return { slot, to: null }
  return { slot, to: slot > from ? slot - 1 : slot }
}

type Options = {
  /** 列表的滚动容器 */
  getContainer: () => HTMLElement | null | undefined
  itemHeight: number
  /** 列表内容顶部的留白 */
  paddingTop: number
  count: () => number
  onDrop: (from: number, to: number) => void
}

/**
 * 定高虚拟列表的拖拽排序。虚拟列表会复用 DOM 节点，SortableJS 一类直接操作 DOM 的库无法使用，
 * 这里只按指针位置计算插入线，松手时交给 onDrop 修改数据
 */
export function useListDragSort(options: Options) {
  /** 被拖项下标；未拖拽时为 null */
  const dragging = ref<number | null>(null)
  /** 插入线相对滚动容器可视区顶部的位置（px） */
  const indicatorTop = ref<number | null>(null)
  let pointerY = 0
  let target: number | null = null
  let rafId = 0

  function update() {
    const container = options.getContainer()
    if (!container || dragging.value === null) return
    const rect = container.getBoundingClientRect()
    const offsetY = pointerY - rect.top + container.scrollTop - options.paddingTop
    const { slot, to } = resolveDrop(offsetY, options.itemHeight, options.count(), dragging.value)
    target = to
    indicatorTop.value = options.paddingTop + slot * options.itemHeight - container.scrollTop
  }

  /** 靠近边缘时按距离线性加速滚动，滚动后重新计算插入位置 */
  function autoScroll() {
    const container = options.getContainer()
    if (container && dragging.value !== null) {
      const rect = container.getBoundingClientRect()
      const speed =
        pointerY < rect.top + EDGE
          ? -MAX_SPEED * Math.min((rect.top + EDGE - pointerY) / EDGE, 1)
          : pointerY > rect.bottom - EDGE
            ? MAX_SPEED * Math.min((pointerY - rect.bottom + EDGE) / EDGE, 1)
            : 0
      if (speed) {
        container.scrollTop += speed
        update()
      }
    }
    rafId = requestAnimationFrame(autoScroll)
  }

  function onMove(event: PointerEvent) {
    pointerY = event.clientY
    update()
  }

  function finish(commit: boolean) {
    const from = dragging.value
    if (commit && from !== null && target !== null) options.onDrop(from, target)
    dragging.value = null
    indicatorTop.value = null
    target = null
    cancelAnimationFrame(rafId)
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
    window.removeEventListener('pointercancel', onCancel)
    window.removeEventListener('keydown', onKeydown, true)
    document.body.classList.remove('select-none', 'cursor-grabbing')
  }

  const onUp = () => finish(true)
  const onCancel = () => finish(false)
  const onKeydown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape') return
    event.preventDefault()
    event.stopPropagation()
    finish(false)
  }

  function start(event: PointerEvent, index: number) {
    if (event.button !== 0 || dragging.value !== null) return
    event.preventDefault()
    dragging.value = index
    pointerY = event.clientY
    update()
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onCancel)
    // 捕获阶段拦截，避免同一次 Esc 把所在的抽屉、歌词页也关掉
    window.addEventListener('keydown', onKeydown, true)
    document.body.classList.add('select-none', 'cursor-grabbing')
    rafId = requestAnimationFrame(autoScroll)
  }

  onScopeDispose(() => finish(false))

  return { dragging, indicatorTop, start }
}
