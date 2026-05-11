/**
 * `src/game/rules.ts`：牌组构造、牌力、排序、发牌等规则函数。
 *
 * 测试边界（范围内）：
 * - 静态牌组数量与分层约束（两副 108 张、四人 27 张）。
 * - 给定级牌时 `playStrength` / `rankPlayStrength` / `sortCards` 的序关系（与实现一致）。
 * - `levelToRank` 的整数关数到点力字符映射。
 *
 * 不在范围内：
 * - 网络对局、Socket 消息、跟牌合法集（见 judge 测）、随机种子可复现性（仅验发牌张数）。
 */

import { describe, it, expect } from 'vitest'
import {
  createDeck,
  dealCards,
  shuffleDeck,
  levelToRank,
  playStrength,
  rankPlayStrength,
  sortCards,
} from '../../../src/game/rules.js'

describe('rules', () => {
  // 边界：只验两副牌总张数，不验花色分布细节
  it('createDeck 两副牌共 108 张', () => {
    expect(createDeck()).toHaveLength(108)
  })

  // 边界：验人数=4 时手牌均匀；不验具体牌面分配
  it('dealCards 四人每人 27 张', () => {
    const deck = shuffleDeck(createDeck())
    const lr = levelToRank(2)
    const hands = dealCards(deck, 4, lr)
    expect(hands.map((h) => h.length)).toEqual([27, 27, 27, 27])
  })

  // 边界：固定级牌 K 时单张级牌 > 非级 2 < SJ < BJ；不测多头牌型
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

  // 边界：比较 rankPlayStrength 数值序，不绑定具体魔法数字
  it('rankPlayStrength：级牌主值高于任意非级牌点数', () => {
    expect(rankPlayStrength('7', '7')).toBeGreaterThan(rankPlayStrength('2', '7'))
    expect(rankPlayStrength('2', 'K')).toBeGreaterThan(rankPlayStrength('A', 'K'))
  })

  // 边界：给定一组固定 rank，验排序后的 rank 序列（升序牌力）
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

  // 边界：关数 → 点力字符的典型映射；极端非法入参不在此测
  it('levelToRank', () => {
    expect(levelToRank(2)).toBe('2')
    expect(levelToRank(10)).toBe('10')
    expect(levelToRank(11)).toBe('J')
    expect(levelToRank(14)).toBe('A')
  })
})
