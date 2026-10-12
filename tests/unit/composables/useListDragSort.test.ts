import { describe, expect, it, vi } from 'vitest'
import { effectScope } from 'vue'

import { resolveDrop, useListDragSort } from '@/composables/useListDragSort'

const H = 56

describe('composables/useListDragSort', () => {
  it('向下拖：插入位置减去自身占位', () => {
    // 从第 1 项拖到第 3、4 项之间（slot 4）
    expect(resolveDrop(4 * H, H, 10, 1)).toEqual({ slot: 4, to: 3 })
  })

  it('向上拖：插入位置即目标下标', () => {
    expect(resolveDrop(1 * H + 10, H, 10, 5)).toEqual({ slot: 1, to: 1 })
  })

  it('落在自身上下边缘时位置不变', () => {
    expect(resolveDrop(2 * H, H, 10, 2).to).toBeNull()
    expect(resolveDrop(3 * H, H, 10, 2).to).toBeNull()
  })

  it('超出列表范围时夹到首尾', () => {
    expect(resolveDrop(-200, H, 5, 3)).toEqual({ slot: 0, to: 0 })
    expect(resolveDrop(99 * H, H, 5, 0)).toEqual({ slot: 5, to: 4 })
  })
})

describe('useListDragSort 交互', () => {
  function setup() {
    const container = document.createElement('div')
    const onDrop = vi.fn()
    const drag = effectScope().run(() =>
      useListDragSort({
        getContainer: () => container,
        itemHeight: H,
        paddingTop: 0,
        count: () => 10,
        onDrop,
      }),
    )!
    return { drag, onDrop }
  }
  const pointer = (type: string, clientY: number) =>
    new PointerEvent(type, { clientY, button: 0, cancelable: true })

  it('松手时按插入位置回调', () => {
    const { drag, onDrop } = setup()
    drag.start(pointer('pointerdown', 28), 0)
    window.dispatchEvent(pointer('pointermove', 4 * H))
    window.dispatchEvent(pointer('pointerup', 4 * H))
    expect(onDrop).toHaveBeenCalledWith(0, 3)
    expect(drag.dragging.value).toBeNull()
  })

  it('Esc 取消拖拽，且不再向外传播', () => {
    const { drag, onDrop } = setup()
    const outer = vi.fn()
    document.addEventListener('keydown', outer)
    drag.start(pointer('pointerdown', 28), 0)
    window.dispatchEvent(pointer('pointermove', 4 * H))
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    window.dispatchEvent(pointer('pointerup', 4 * H))
    expect(onDrop).not.toHaveBeenCalled()
    expect(outer).not.toHaveBeenCalled()
    document.removeEventListener('keydown', outer)
  })
})
