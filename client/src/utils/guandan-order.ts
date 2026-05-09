import type { Card, CardRank } from '@/types'

/** 与 server/src/game/rules.ts 中 CARD_VALUES 一致（可用于朗读键名等） */
export const CARD_VALUES: Record<CardRank, number> = {
  '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
  'J': 11, 'Q': 12, 'K': 13, 'A': 14, '2': 15,
  'SJ': 16, 'BJ': 17,
}

const SUIT_ORDER_FOR_LEVEL: Record<'spades' | 'hearts' | 'clubs' | 'diamonds', number> = {
  spades: 4,
  hearts: 3,
  clubs: 2,
  diamonds: 1,
}

function isLevelCard(card: Card, levelRank: CardRank): boolean {
  if (card.suit === 'joker') return false
  return card.rank === levelRank
}

/** 与服务器 playStrength 一致，用于手牌展示排序 */
export function playStrength(card: Card, levelRank: CardRank): number {
  if (card.rank === 'BJ') return 5_000_000
  if (card.rank === 'SJ') return 4_000_000
  if (isLevelCard(card, levelRank)) {
    const suit = card.suit as keyof typeof SUIT_ORDER_FOR_LEVEL
    const suitBonus = SUIT_ORDER_FOR_LEVEL[suit] ?? 0
    return 3_000_000 + suitBonus * 1000 + CARD_VALUES[card.rank]
  }
  return CARD_VALUES[card.rank]
}
