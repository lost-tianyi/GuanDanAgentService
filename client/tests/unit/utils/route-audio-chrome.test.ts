/**
 * `src/utils/route-audio-chrome.ts` 路由名 → 是否展示悬浮音频控件。
 *
 * 测试边界（范围内）：
 * - `showFloatingAudioChrome(routeName)` 对已知路由名与 `undefined` 的布尔返回值。
 *
 * 不在范围内：
 * - 音频实际播放、路由守卫、组件挂载顺序。
 */

import { describe, expect, it } from 'vitest'
import { showFloatingAudioChrome } from '@/utils/route-audio-chrome'

describe('showFloatingAudioChrome', () => {
  // 边界：对局页沉浸布局，不显示全局悬浮条
  it('hides floating chrome on game route', () => {
    expect(showFloatingAudioChrome('game')).toBe(false)
  })

  // 边界：首页等非 game 路由显示悬浮控件
  it('shows floating chrome on home', () => {
    expect(showFloatingAudioChrome('home')).toBe(true)
  })

  // 边界：未匹配路由名时默认展示（避免误藏控件）
  it('shows floating chrome when route unknown', () => {
    expect(showFloatingAudioChrome(undefined)).toBe(true)
  })
})
