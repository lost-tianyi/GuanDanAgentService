/**
 * 逻辑画布等比缩放纯函数。
 *
 * @vitest-environment node
 */

import { describe, expect, it } from 'vitest'
import {
  computeUniformScale,
  MOBILE_LANDSCAPE_DESIGN_HEIGHT,
  MOBILE_LANDSCAPE_DESIGN_WIDTH,
  MOBILE_LANDSCAPE_VISUAL_COMPACT,
} from '@/utils/layout-scale'

describe('MOBILE_LANDSCAPE_VISUAL_COMPACT', () => {
  it('is a fractional margin inside (0, 1] for uniform extra shrink', () => {
    expect(MOBILE_LANDSCAPE_VISUAL_COMPACT).toBeGreaterThan(0)
    expect(MOBILE_LANDSCAPE_VISUAL_COMPACT).toBeLessThanOrEqual(1)
  })
})

describe('computeUniformScale', () => {
  // 边界：典型手机横屏视口略小于设计稿 → scale<1，且为宽高「contain」较小比
  it('fits design canvas inside typical landscape viewport without exceeding 1', () => {
    const s = computeUniformScale(844, 390, MOBILE_LANDSCAPE_DESIGN_WIDTH, MOBILE_LANDSCAPE_DESIGN_HEIGHT)
    expect(s).toBeLessThanOrEqual(1)
    expect(s).toBeCloseTo(Math.min(844 / MOBILE_LANDSCAPE_DESIGN_WIDTH, 390 / MOBILE_LANDSCAPE_DESIGN_HEIGHT), 5)
  })

  // 边界：视口不比设计稿更「紧」的一侧决定比例（横边更紧）
  it('uses min of width and height ratios', () => {
    const s = computeUniformScale(400, 900, 800, 400)
    expect(s).toBeCloseTo(0.5, 5)
  })

  // 边界：超大视口不放大超过 1（避免拉伸位图）
  it('never upscales beyond 1', () => {
    expect(computeUniformScale(2000, 1200, 852, 393)).toBe(1)
  })

  // 边界：非法输入退回 1，避免 NaN
  it('returns 1 for non-positive dimensions', () => {
    expect(computeUniformScale(0, 844, 852, 393)).toBe(1)
    expect(computeUniformScale(390, 844, 0, 393)).toBe(1)
  })
})
