import { describe, expect, it } from 'vitest'
import { TIER1_PHRASE_KEYS } from './game-assets-preload'

describe('game-assets-preload', () => {
  it('tier1 phrase keys list is bounded', () => {
    expect(TIER1_PHRASE_KEYS.length).toBeGreaterThan(0)
    expect(TIER1_PHRASE_KEYS.length).toBeLessThanOrEqual(20)
    expect(TIER1_PHRASE_KEYS).toContain('pass_skip')
  })
})
