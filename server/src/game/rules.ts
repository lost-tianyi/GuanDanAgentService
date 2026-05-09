export type CardSuit = 'spades' | 'hearts' | 'clubs' | 'diamonds' | 'joker'
export type CardRank = '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A' | '2' | 'SJ' | 'BJ'

export interface Card {
  id: string
  suit: CardSuit
  rank: CardRank
  value: number
}

export type CardPatternType =
  | 'single'
  | 'pair'
  | 'triple'
  | 'triple_with_pair'
  | 'straight'
  | 'straight_pair' // 三连对（三连对木板）
  | 'triple_run' // 三同连张：相邻两副三张（掼蛋“钢板”）
  | 'bomb'
  | 'straight_bomb'
  | 'joker_bomb'

export interface CardPattern {
  type: CardPatternType
  cards: Card[]
  mainValue: number
}

export const CARD_VALUES: Record<CardRank, number> = {
  '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
  'J': 11, 'Q': 12, 'K': 13, 'A': 14, '2': 15,
  'SJ': 16, 'BJ': 17
}

const SUIT_ORDER_FOR_LEVEL: Record<'spades' | 'hearts' | 'clubs' | 'diamonds', number> = {
  spades: 4,
  hearts: 3,
  clubs: 2,
  diamonds: 1,
}

/** 是否为当前「打几」对应点数的级牌（不含王牌） */
export function isLevelCard(card: Card, levelRank: CardRank): boolean {
  if (card.suit === 'joker') return false
  return card.rank === levelRank
}

/** 逢人配：红桃级牌，可作万能牌组牌 */
export function isFengRenPei(card: Card, levelRank: CardRank): boolean {
  return card.suit === 'hearts' && card.rank === levelRank
}

/** 与 buildValueCounts 的数值键一致，不含王牌 */
export function valueKeyToRank(v: number): CardRank | null {
  const ranks: CardRank[] = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2']
  for (const r of ranks) {
    if (CARD_VALUES[r] === v) return r
  }
  return null
}

/** 顺子算法里使用的序号末端（3～14，14=A）→ 点数 */
export function straightEndNumberToRank(end: number): CardRank {
  if (end >= 3 && end <= 10) return String(end) as CardRank
  const map: Record<number, CardRank> = { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' }
  return map[end]!
}

/**
 * 掼蛋：大王 > 小王 > 级牌（级牌间：黑桃>红桃>梅花>方块）> 其余牌。
 * 其余牌按自然大小：非级牌 2 > A > … > 3。
 */
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

/**
 * 牌型主点数比较（顺子/炸弹等同一点数一致；不含王牌花色）
 */
export function rankPlayStrength(rank: CardRank, levelRank: CardRank): number {
  if (rank === 'BJ') return 5_000_000
  if (rank === 'SJ') return 4_000_000
  if (rank === levelRank) return 3_000_000 + CARD_VALUES[rank]
  return CARD_VALUES[rank]
}

export const RANK_ORDER: CardRank[] = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2', 'SJ', 'BJ']

/** 升级对应的级牌（当前打几）：2～10、J、Q、K、A（14） */
export function levelToRank(level: number): CardRank {
  if (level >= 2 && level <= 9) return String(level) as CardRank
  if (level === 10) return '10'
  if (level === 11) return 'J'
  if (level === 12) return 'Q'
  if (level === 13) return 'K'
  if (level === 14) return 'A'
  return '2'
}

/**
 * 掼蛋（惯蛋）：四人、两副牌共 108 张（每副 52 张 + 小王、大王各 1 张），每人 27 张。
 */
export function createDeck(): Card[] {
  const suits: CardSuit[] = ['spades', 'hearts', 'clubs', 'diamonds']
  const ranks: CardRank[] = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2']

  const deck: Card[] = []
  let id = 0

  for (let d = 0; d < 2; d++) {
    for (const suit of suits) {
      for (const rank of ranks) {
        deck.push({
          id: `d${d}_${suit}_${rank}_${id++}`,
          suit,
          rank,
          value: CARD_VALUES[rank],
        })
      }
    }
    deck.push({
      id: `d${d}_joker_SJ_${id++}`,
      suit: 'joker',
      rank: 'SJ',
      value: CARD_VALUES['SJ'],
    })
    deck.push({
      id: `d${d}_joker_BJ_${id++}`,
      suit: 'joker',
      rank: 'BJ',
      value: CARD_VALUES['BJ'],
    })
  }

  return deck
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export function dealCards(deck: Card[], playerCount: number, levelRank: CardRank): Card[][] {
  const hands: Card[][] = Array.from({ length: playerCount }, () => [])
  const cardsPerPlayer = Math.floor(deck.length / playerCount)

  let cardIndex = 0
  for (let i = 0; i < cardsPerPlayer; i++) {
    for (let p = 0; p < playerCount; p++) {
      if (deck[cardIndex]) {
        hands[p].push(deck[cardIndex++])
      }
    }
  }

  return hands.map((hand) => sortCards(hand, levelRank))
}

export function sortCards(cards: Card[], levelRank: CardRank): Card[] {
  return [...cards].sort((a, b) => {
    const da = playStrength(a, levelRank)
    const db = playStrength(b, levelRank)
    if (da !== db) return da - db
    return a.id.localeCompare(b.id)
  })
}

export function getCardDisplay(rank: CardRank, suit: CardSuit): string {
  const suitSymbols: Record<CardSuit, string> = {
    spades: '♠', hearts: '♥', clubs: '♣', diamonds: '♦', joker: '🃏'
  }
  return `${rank}${suitSymbols[suit]}`
}
