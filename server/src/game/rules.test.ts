import { describe, it, expect } from 'vitest'
import { createDeck, dealCards, shuffleDeck, levelToRank } from './rules.js'

describe('rules', () => {
  it('createDeck 两副牌共 108 张', () => {
    expect(createDeck()).toHaveLength(108)
  })

  it('dealCards 四人每人 27 张', () => {
    const deck = shuffleDeck(createDeck())
    const hands = dealCards(deck, 4)
    expect(hands.map((h) => h.length)).toEqual([27, 27, 27, 27])
  })

  it('levelToRank', () => {
    expect(levelToRank(2)).toBe('2')
    expect(levelToRank(10)).toBe('10')
    expect(levelToRank(11)).toBe('J')
    expect(levelToRank(14)).toBe('A')
  })
})
