/**
 * `src/utils/game-assets-preload.ts` 导出常量契约（不跑真实网络/解码）。
 *
 * 测试边界（范围内）：
 * - Tier1 短语 key 列表规模与必含项；预加载超时毫秒数与产品约定一致。
 *
 * 不在范围内：
 * - 实际 fetch 图片/音频、浏览器 Audio 元素、并发预加载时序。
 */

import { describe, expect, it } from 'vitest'
import { TIER1_PHRASE_KEYS, TIER1_PRELOAD_TIMEOUT_MS } from '@/utils/game-assets-preload'

describe('game-assets-preload exports', () => {
  // 边界：列表非空、数量有上限（避免弱网一次性拉过多 wav）
  it('tier1 phrase keys list is bounded and contains pass_skip', () => {
    expect(TIER1_PHRASE_KEYS.length).toBeGreaterThan(0)
    expect(TIER1_PHRASE_KEYS.length).toBeLessThanOrEqual(20)
    expect(TIER1_PHRASE_KEYS).toContain('pass_skip')
  })

  // 边界：与 Home 预加载遮罩「最多 N 秒」文案及降级策略对齐
  it('tier1 preload timeout matches 15s UX degrade threshold', () => {
    expect(TIER1_PRELOAD_TIMEOUT_MS).toBe(15_000)
  })
})
