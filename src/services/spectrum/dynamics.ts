/** 下落速度（满高度/秒）；上升直接跟随，保留鼓点冲击感 */
const FALL_SPEED = 1.8
const PEAK_HOLD = 0.35
/** 峰值帽下落加速度（满高度/秒²） */
const PEAK_GRAVITY = 3.5
const IDLE_EPSILON = 0.002

/**
 * 柱高的快升慢降与峰值帽。按帧间隔 dt 计算，与 60/120Hz 刷新率无关。
 * 所有缓冲区预分配并复用，避免每帧产生垃圾
 */
export function createDynamics(count: number) {
  const levels = new Float32Array(count)
  const peaks = new Float32Array(count)
  const peakHold = new Float32Array(count)
  const peakVelocity = new Float32Array(count)

  /** input 为 null 时视为静音，用于暂停后的归零动画 */
  function step(input: Float32Array | null, dt: number) {
    for (let i = 0; i < count; i++) {
      const target = input ? input[i]! : 0
      levels[i] = target >= levels[i]! ? target : Math.max(target, levels[i]! - FALL_SPEED * dt)

      if (levels[i]! >= peaks[i]!) {
        peaks[i] = levels[i]!
        peakHold[i] = PEAK_HOLD
        peakVelocity[i] = 0
      } else if (peakHold[i]! > 0) {
        peakHold[i] = peakHold[i]! - dt
      } else {
        peakVelocity[i] = peakVelocity[i]! + PEAK_GRAVITY * dt
        peaks[i] = Math.max(levels[i]!, peaks[i]! - peakVelocity[i]! * dt)
      }
    }
  }

  function isIdle() {
    for (let i = 0; i < count; i++) {
      if (levels[i]! > IDLE_EPSILON || peaks[i]! > IDLE_EPSILON) return false
    }
    return true
  }

  function reset() {
    levels.fill(0)
    peaks.fill(0)
    peakHold.fill(0)
    peakVelocity.fill(0)
  }

  return { levels, peaks, step, isIdle, reset }
}
