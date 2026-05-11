import { describe, expect, it } from 'vitest'
import { TIER1_PHRASE_KEYS, TIER1_PRELOAD_TIMEOUT_MS } from './game-assets-preload'

describe('game-assets-preload', () => {
  it('tier1 phrase keys list is bounded', () => {
    expect(TIER1_PHRASE_KEYS.length).toBeGreaterThan(0)
    expect(TIER1_PHRASE_KEYS.length).toBeLessThanOrEqual(20)
    expect(TIER1_PHRASE_KEYS).toContain('pass_skip')
  })

  it('tier1 preload timeout is 15s for UX degrade threshold', () => {
    expect(TIER1_PRELOAD_TIMEOUT_MS).toBe(15_000)
  })
})
