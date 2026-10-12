/** 倒影占画布高度的比例 */
export const REFLECTION_RATIO = 0.22
const REFLECTION_ALPHA = 0.28

/**
 * 在 contentHeight 下方绘制倒影：坐标系上下翻转后重绘一次，再用 destination-out 渐隐。
 * 渐隐会擦掉 canvas 上倒影区域的全部内容，因此必须在正常绘制之后调用
 */
export function drawReflection(
  ctx: CanvasRenderingContext2D,
  width: number,
  contentHeight: number,
  canvasHeight: number,
  paint: () => void,
) {
  ctx.save()
  ctx.globalAlpha = REFLECTION_ALPHA
  ctx.translate(0, contentHeight * 2)
  ctx.scale(1, -1)
  paint()
  ctx.restore()

  ctx.save()
  ctx.globalCompositeOperation = 'destination-out'
  const fade = ctx.createLinearGradient(0, contentHeight, 0, canvasHeight)
  fade.addColorStop(0, 'rgba(0,0,0,0)')
  fade.addColorStop(1, 'rgba(0,0,0,1)')
  ctx.fillStyle = fade
  ctx.fillRect(0, contentHeight, width, canvasHeight - contentHeight)
  ctx.restore()
}
