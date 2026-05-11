/**
 * 手机横屏「设计稿画布」等比适配：整页放入固定逻辑分辨率后整体 scale，保持内部相对布局不变。
 */

/** 逻辑设计宽（CSS px），与常见手机横屏宽度级一致 */
export const MOBILE_LANDSCAPE_DESIGN_WIDTH = 852

/** 逻辑设计高（CSS px） */
export const MOBILE_LANDSCAPE_DESIGN_HEIGHT = 393

/**
 * 在 `computeUniformScale` 结果之上再乘一层，使整块舞台略小于视口（四周留白），
 * 内部按钮/手牌/头像相对比例不变。仅应由手机横屏舞台 `transform: scale` 使用。
 */
export const MOBILE_LANDSCAPE_VISUAL_COMPACT = 0.85

/**
 * 将 designW×designH 的画布放入 viewport 内，取较小比例以完整可见。
 * 最大为 1：不放大超过设计稿（避免位图发糊与触控目标膨胀）。
 */
export function computeUniformScale(
  viewportW: number,
  viewportH: number,
  designW: number,
  designH: number,
): number {
  if (designW <= 0 || designH <= 0 || viewportW <= 0 || viewportH <= 0) return 1
  const s = Math.min(viewportW / designW, viewportH / designH)
  return Math.min(s, 1)
}
