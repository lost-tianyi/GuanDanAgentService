import { describe, it, expect } from 'vitest'
import { createDeck, rankPlayStrength } from './rules.js'
import { analyzePattern, canBeat } from './judge.js'

describe('judge', () => {
  it('analyzePattern 识别单张', () => {
    const deck = createDeck()
    const p = analyzePattern([deck[0]], { levelRank: '2' })
    expect(p?.type).toBe('single')
    expect(p?.cards).toHaveLength(1)
  })

  it('canBeat：普通大牌压小牌（单张）', () => {
    const deck = createDeck()
    const ctx = { levelRank: '2' as const }
    const low = deck.find((c) => c.rank === '3')!
    const high = deck.find((c) => c.rank === 'K')!
    const plow = analyzePattern([low], ctx)!
    const phigh = analyzePattern([high], ctx)!
    expect(canBeat(phigh, plow)).toBe(true)
    expect(canBeat(plow, phigh)).toBe(false)
  })

  it('级牌单张压制非级牌 2（当前打 K）', () => {
    const deck = createDeck()
    const ctx = { levelRank: 'K' as const }
    const levelK = deck.find((c) => c.rank === 'K' && c.suit === 'spades')!
    const nonLevel2 = deck.find((c) => c.rank === '2' && c.suit === 'spades')!
    const pLevel = analyzePattern([levelK], ctx)!
    const p2 = analyzePattern([nonLevel2], ctx)!
    expect(canBeat(pLevel, p2)).toBe(true)
    expect(canBeat(p2, pLevel)).toBe(false)
    expect(pLevel.mainValue).toBeGreaterThan(p2.mainValue)
  })

  it('逢人配（红桃级牌）可单独成合法单张', () => {
    const deck = createDeck()
    const ctx = { levelRank: '8' as const }
    const feng = deck.find((c) => c.rank === '8' && c.suit === 'hearts')!
    const p = analyzePattern([feng], ctx)
    expect(p?.type).toBe('single')
    expect(p.mainValue).toBeGreaterThan(rankPlayStrength('8', '8') - 1000)
  })

  it('逢人配可与其它牌组成对子', () => {
    const deck = createDeck()
    const ctx = { levelRank: '6' as const }
    const feng = deck.find((c) => c.rank === '6' && c.suit === 'hearts')!
    const sixSpades = deck.find((c) => c.rank === '6' && c.suit === 'spades')!
    const p = analyzePattern([feng, sixSpades], ctx)
    expect(p?.type).toBe('pair')
    expect(p?.mainValue).toBe(rankPlayStrength('6', '6'))
  })

  it('同张数炸弹：级牌炸弹大于非级牌 2 炸弹（打 5）', () => {
    const deck = createDeck()
    const ctx = { levelRank: '5' as const }
    const levelFives = deck.filter((c) => c.rank === '5').slice(0, 4)
    const twos = deck.filter((c) => c.rank === '2').slice(0, 4)
    const pb = analyzePattern(levelFives, ctx)!
    const p2 = analyzePattern(twos, ctx)!
    expect(pb.type).toBe('bomb')
    expect(p2.type).toBe('bomb')
    expect(canBeat(pb, p2)).toBe(true)
    expect(canBeat(p2, pb)).toBe(false)
  })

  it('顺子：同长度时比较末端牌力（混花色避免判成同花顺）', () => {
    const deck = createDeck()
    const ctx = { levelRank: '3' as const }
    const pick = (rank: string, suit: string) => deck.find((c) => c.rank === rank && c.suit === suit)!
    const straightLow = [
      pick('7', 'spades'),
      pick('8', 'hearts'),
      pick('9', 'clubs'),
      pick('10', 'diamonds'),
      pick('J', 'spades'),
    ]
    const straightHigh = [
      pick('8', 'clubs'),
      pick('9', 'spades'),
      pick('10', 'hearts'),
      pick('J', 'diamonds'),
      pick('Q', 'clubs'),
    ]
    const pa = analyzePattern(straightLow, ctx)!
    const pb = analyzePattern(straightHigh, ctx)!
    expect(pa.type).toBe('straight')
    expect(pb.type).toBe('straight')
    expect(canBeat(pb, pa)).toBe(true)
  })

  it('小王、大王单张次序正确', () => {
    const deck = createDeck()
    const ctx = { levelRank: 'A' as const }
    const sj = deck.find((c) => c.rank === 'SJ')!
    const bj = deck.find((c) => c.rank === 'BJ')!
    const levelA = deck.find((c) => c.rank === 'A' && c.suit === 'clubs')!
    const psj = analyzePattern([sj], ctx)!
    const pbj = analyzePattern([bj], ctx)!
    const pa = analyzePattern([levelA], ctx)!
    expect(canBeat(pbj, psj)).toBe(true)
    expect(canBeat(psj, pa)).toBe(true)
    expect(canBeat(pa, psj)).toBe(false)
  })
})
