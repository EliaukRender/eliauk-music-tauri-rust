import { nextTick, onScopeDispose, type Ref } from 'vue'
import { useRouter } from 'vue-router'

/**
 * 页面滚动发生在布局内的容器而不是 window，router 的 scrollBehavior 管不到。
 * 按 fullPath 记录离开时的位置，回到该页面时恢复；首次进入的页面回到顶部
 */
export function useScrollRestore(container: Ref<HTMLElement | null>) {
  const router = useRouter()
  const positions = new Map<string, number>()

  const removeBefore = router.beforeEach((_to, from) => {
    if (container.value) positions.set(from.fullPath, container.value.scrollTop)
  })
  const removeAfter = router.afterEach(async (to, from) => {
    if (to.fullPath === from.fullPath) return
    await nextTick()
    container.value?.scrollTo({ top: positions.get(to.fullPath) ?? 0 })
  })

  onScopeDispose(() => {
    removeBefore()
    removeAfter()
  })
}
