import { describe, it, expect } from 'vitest'
import { createDeck } from './rules.js'
import { analyzePattern, canBeat } from './judge.js'

describe('judge', () => {
  const ctx = { levelRank: '2' as const }

  it('analyzePattern 识别单张', () => {
    const deck = createDeck()
    const p = analyzePattern([deck[0]], ctx)
    expect(p?.type).toBe('single')
    expect(p?.cards).toHaveLength(1)
  })

  it('canBeat：大牌压小牌（单张）', () => {
    const deck = createDeck()
    const low = deck.find((c) => c.rank === '3')!
    const high = deck.find((c) => c.rank === 'K')!
    const plow = analyzePattern([low], ctx)!
    const phigh = analyzePattern([high], ctx)!
    expect(canBeat(phigh, plow)).toBe(true)
    expect(canBeat(plow, phigh)).toBe(false)
  })
})
