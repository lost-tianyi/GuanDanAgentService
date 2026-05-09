import { describe, it, expect } from 'vitest'
import {
  createDeck,
  dealCards,
  shuffleDeck,
  levelToRank,
  playStrength,
  rankPlayStrength,
  sortCards,
} from './rules.js'

describe('rules', () => {
  it('createDeck 两副牌共 108 张', () => {
    expect(createDeck()).toHaveLength(108)
  })

  it('dealCards 四人每人 27 张', () => {
    const deck = shuffleDeck(createDeck())
    const lr = levelToRank(2)
    const hands = dealCards(deck, 4, lr)
    expect(hands.map((h) => h.length)).toEqual([27, 27, 27, 27])
  })

  it('级牌点力强于非级牌 2；大王小王封顶', () => {
    const deck = createDeck()
    const lr = 'K' as const
    const levelK = deck.find((c) => c.rank === 'K' && c.suit === 'spades')!
    const nonLevel2 = deck.find((c) => c.rank === '2' && c.suit === 'spades')!
    const sj = deck.find((c) => c.rank === 'SJ')!
    const bj = deck.find((c) => c.rank === 'BJ')!
    expect(playStrength(levelK, lr)).toBeGreaterThan(playStrength(nonLevel2, lr))
    expect(playStrength(sj, lr)).toBeGreaterThan(playStrength(levelK, lr))
    expect(playStrength(bj, lr)).toBeGreaterThan(playStrength(sj, lr))
  })

  it('rankPlayStrength：级牌主值高于任意非级牌点数', () => {
    expect(rankPlayStrength('7', '7')).toBeGreaterThan(rankPlayStrength('2', '7'))
    expect(rankPlayStrength('2', 'K')).toBeGreaterThan(rankPlayStrength('A', 'K'))
  })

  it('sortCards：按掼蛋牌力升序排列', () => {
    const deck = createDeck()
    const lr = '5' as const
    const cards = [
      deck.find((c) => c.rank === '3' && c.suit === 'spades')!,
      deck.find((c) => c.rank === '2' && c.suit === 'clubs')!,
      deck.find((c) => c.rank === '5' && c.suit === 'diamonds')!,
      deck.find((c) => c.rank === 'SJ')!,
    ]
    const sorted = sortCards(cards, lr)
    expect(sorted.map((c) => c.rank)).toEqual(['3', '2', '5', 'SJ'])
  })

  it('levelToRank', () => {
    expect(levelToRank(2)).toBe('2')
    expect(levelToRank(10)).toBe('10')
    expect(levelToRank(11)).toBe('J')
    expect(levelToRank(14)).toBe('A')
  })
})
