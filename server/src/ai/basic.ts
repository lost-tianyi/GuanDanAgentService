import type { Card, CardPattern } from '../game/rules.js'
import { sortCards } from '../game/rules.js'
import { analyzePattern, canBeat } from '../game/judge.js'
import type { GuandanGame } from '../game/game.js'
import { findLegalBeatingPlay } from './legal-move-fallback.js'

export type AIDifficulty = 'easy' | 'normal' | 'hard'

export class BasicAI {
  private game: GuandanGame
  private difficulty: AIDifficulty
  
  constructor(game: GuandanGame, difficulty: AIDifficulty = 'normal') {
    this.game = game
    this.difficulty = difficulty
  }
  
  selectCards(cards: Card[], lastPattern: CardPattern | null): Card[] {
    if (lastPattern === null) {
      return this.selectFirstPlay(cards)
    }
    
    const beatingCards = this.findBeatingCards(cards, lastPattern)
    
    if (beatingCards.length > 0) {
      return this.selectBestBeating(beatingCards, lastPattern)
    }
    
    if (this.shouldPass(cards, lastPattern)) {
      return []
    }
    
    return this.findSmallestBeatable(cards, lastPattern) || []
  }
  
  private selectFirstPlay(cards: Card[]): Card[] {
    const patterns = this.findAllPatterns(cards)
      .map((cards) => ({ cards, pattern: analyzePattern(cards, this.game.getJudgeContext()) }))
      .filter((p): p is { cards: Card[]; pattern: NonNullable<ReturnType<typeof analyzePattern>> } => !!p.pattern)
    
    if (this.difficulty === 'easy') {
      return patterns.find(p => p.pattern.type === 'single')?.cards || cards.slice(0, 1)
    }
    
    const bomb = patterns.find(p => p.pattern.type === 'bomb' || p.pattern.type === 'joker_bomb')
    if (bomb && Math.random() > 0.5) {
      return bomb.cards
    }
    
    const straight = patterns.find(p => p.pattern.type === 'straight')
    if (straight) return straight.cards
    
    const pair = patterns.find(p => p.pattern.type === 'pair')
    if (pair) return pair.cards
    
    return cards.slice(0, 1)
  }
  
  private findBeatingCards(cards: Card[], target: CardPattern): Card[][] {
    const ctx = this.game.getJudgeContext()
    const results: Card[][] = []

    if (target.type === 'single') {
      for (const c of cards) {
        const p = analyzePattern([c], ctx)
        if (p && canBeat(p, target)) results.push([c])
      }
      return results
    }

    if (target.type === 'pair') {
      for (let i = 0; i < cards.length; i++) {
        for (let j = i + 1; j < cards.length; j++) {
          const p = analyzePattern([cards[i], cards[j]], ctx)
          if (p?.type === 'pair' && canBeat(p, target)) results.push([cards[i], cards[j]])
        }
      }
      return results
    }

    if (target.type === 'triple') {
      for (let i = 0; i < cards.length; i++) {
        for (let j = i + 1; j < cards.length; j++) {
          for (let k = j + 1; k < cards.length; k++) {
            const p = analyzePattern([cards[i], cards[j], cards[k]], ctx)
            if (p?.type === 'triple' && canBeat(p, target)) results.push([cards[i], cards[j], cards[k]])
          }
        }
      }
      return results
    }

    const fb = findLegalBeatingPlay(cards, target, ctx)
    if (fb) results.push(fb)
    return results
  }
  
  private selectBestBeating(beatingCards: Card[][], target: CardPattern): Card[] {
    if (this.difficulty === 'easy') {
      return beatingCards[Math.floor(Math.random() * beatingCards.length)]
    }
    
    const bombs = beatingCards.filter(c => c.length >= 4)
    if (bombs.length > 0) {
      return bombs[0]
    }
    
    return beatingCards.reduce((min, curr) => 
      curr.length < min.length ? curr : min
    )
  }
  
  private shouldPass(cards: Card[], lastPattern: CardPattern): boolean {
    if (this.difficulty === 'easy') {
      return Math.random() > 0.3
    }
    return findLegalBeatingPlay(cards, lastPattern, this.game.getJudgeContext()) === null
  }
  
  private findSmallestBeatable(cards: Card[], target: CardPattern): Card[] | null {
    const beating = this.findBeatingCards(cards, target)
    if (beating.length === 0) return null
    
    return beating.reduce((min, curr) => {
      const minMain = analyzePattern(min, this.game.getJudgeContext())?.mainValue || 0
      const currMain = analyzePattern(curr, this.game.getJudgeContext())?.mainValue || 0
      return currMain < minMain ? curr : min
    })
  }
  
  private findAllPatterns(cards: Card[]): Card[][] {
    const results: Card[][] = []
    const grouped = new Map<string, Card[]>()
    for (const card of cards) {
      const key = card.rank
      const g = grouped.get(key) || []
      g.push(card)
      grouped.set(key, g)
    }

    for (const [, group] of grouped) {
      if (group.length >= 1) results.push([group[0]])
      if (group.length >= 2) results.push(group.slice(0, 2))
      if (group.length >= 3) results.push(group.slice(0, 3))
      if (group.length >= 4) results.push(group.slice(0, 4))
    }
    
    const sorted = sortCards(cards, this.game.getJudgeContext().levelRank)
    for (let len = 5; len <= sorted.length; len++) {
      for (let i = 0; i <= sorted.length - len; i++) {
        const subset = sorted.slice(i, i + len)
        if (analyzePattern(subset, this.game.getJudgeContext())) {
          results.push(subset)
        }
      }
    }
    
    return results
  }
  
}
