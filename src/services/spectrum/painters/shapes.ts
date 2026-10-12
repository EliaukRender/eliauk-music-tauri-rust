/** 圆角半径上限（CSS 像素），柱子很宽时不至于变成胶囊 */
const MAX_RADIUS = 4

export type Corners = 'top' | 'all'

/** 向 path 追加矩形；rounded 时按柱宽取圆角，roundRect 会在高度不足时自动缩小半径 */
export function addBar(
  path: Path2D,
  x: number,
  y: number,
  width: number,
  height: number,
  rounded: boolean,
  dpr: number,
  corners: Corners = 'top',
) {
  if (height <= 0) return
  if (!rounded) {
    path.rect(x, y, width, height)
    return
  }
  const r = Math.min(width / 2, MAX_RADIUS * dpr)
  path.roundRect(x, y, width, height, corners === 'top' ? [r, r, 0, 0] : r)
}

/** 顶点之间用二次贝塞尔经过中点连接，得到平滑曲线 */
export function tracePoints(
  path: Path2D,
  xs: (i: number) => number,
  ys: (i: number) => number,
  n: number,
) {
  for (let i = 0; i < n - 1; i++) {
    const midX = (xs(i) + xs(i + 1)) / 2
    const midY = (ys(i) + ys(i + 1)) / 2
    path.quadraticCurveTo(xs(i), ys(i), midX, midY)
  }
  path.lineTo(xs(n - 1), ys(n - 1))
}
