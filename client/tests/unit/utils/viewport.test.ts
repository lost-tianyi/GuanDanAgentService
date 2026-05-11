/**
 * `src/utils/viewport.ts` 纯函数单元测试（Node / Vitest）。
 *
 * 测试边界（范围内）：
 * - `isMobileUiCandidate`、`shouldShowPortraitGate` 在给定 UA、Client Hints、视口宽高下的返回值。
 *
 * 不在范围内：
 * - 真实设备陀螺仪、安全区、CSS env(safe-area)。
 * - Vue 组件、`PortraitRotateGate` DOM。
 */

import { describe, expect, it } from 'vitest'
import { isMobileUiCandidate, shouldShowPortraitGate } from '@/utils/viewport'

const iphoneUa =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
const desktopChromeUa =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

describe('isMobileUiCandidate', () => {
  // 边界：Client Hints 声明 mobile 时，桌面 UA 也应判为移动候选（Hints 优先）
  it('returns true when userAgentData.mobile is true regardless of UA', () => {
    expect(isMobileUiCandidate(desktopChromeUa, true)).toBe(true)
  })

  // 边界：Hints 否认 mobile 但 UA 为典型 iPhone → 仍以 UA 为准（自动化/异常 Hints）
  it('mobile UA overrides inconsistent userAgentData.mobile false (Chromium / automation)', () => {
    expect(isMobileUiCandidate(iphoneUa, false)).toBe(true)
  })

  // 边界：无 Hints 时仅依赖 UA 子串启发式；桌面 Chrome UA 应为 false
  it('detects mobile from UA when hints absent', () => {
    expect(isMobileUiCandidate(iphoneUa, undefined)).toBe(true)
    expect(isMobileUiCandidate(desktopChromeUa, undefined)).toBe(false)
  })
})

describe('shouldShowPortraitGate', () => {
  // 边界：移动 + 竖屏（宽<高）→ 需展示横屏引导
  it('mobile + portrait → gate', () => {
    expect(shouldShowPortraitGate(390, 844, iphoneUa)).toBe(true)
  })

  // 边界：移动 + 横屏（宽>高）→ 不挡交互
  it('mobile + landscape → no gate', () => {
    expect(shouldShowPortraitGate(844, 390, iphoneUa)).toBe(false)
  })

  // 边界：桌面 UA 竖屏也不展示 gate（非移动候选）
  it('desktop + portrait → no gate', () => {
    expect(shouldShowPortraitGate(600, 900, desktopChromeUa)).toBe(false)
  })

  // 边界：桌面 UA + Hints.mobile=true → 仍按移动处理 gate
  it('respects userAgentData.mobile when UA is desktop-class', () => {
    expect(shouldShowPortraitGate(390, 844, desktopChromeUa, true)).toBe(true)
    expect(shouldShowPortraitGate(390, 844, desktopChromeUa, false)).toBe(false)
  })

  // 边界：与 isMobileUiCandidate 一致，iPhone UA 在 Hints=false 时仍为移动
  it('iPhone UA shows portrait gate even if hints say non-mobile', () => {
    expect(shouldShowPortraitGate(390, 844, iphoneUa, false)).toBe(true)
  })
})
