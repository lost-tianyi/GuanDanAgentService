/**
 * 手牌横向占用宽度与缩放比纯函数。
 *
 * @vitest-environment happy-dom
 */

import { describe, expect, it } from 'vitest'
import type { Card } from '@/types'
import {
  collapsedRankStackOverflowCount,
  computeHandCardLayout,
  effectiveMaxStackDepthForLayout,
  HAND_CARD_MIN_RATIO,
  handCardsAllocatedHeightPx,
  handCardsAllocatedWidthPx,
  handCardsContainerLayoutWidthPx,
  handCardsOuterWidthUnit,
  MOBILE_RANK_STACK_COLLAPSED_VISIBLE,
  verticalStackDesignUnit,
  visibleCardsForRankStack,
} from '@/utils/hand-cards-layout'

function c(id: string, rank: Card['rank'], suit: Card['suit'] = 'spades'): Card {
  return { id, rank, suit, value: 0 }
}

describe('handCardsContainerLayoutWidthPx', () => {
  it('prefers offsetWidth over clientWidth when positive', () => {
    const el = document.createElement('div')
    Object.defineProperty(el, 'offsetWidth', { value: 640, configurable: true })
    Object.defineProperty(el, 'clientWidth', { value: 638, configurable: true })
    expect(handCardsContainerLayoutWidthPx(el)).toBe(640)
  })

  it('falls back to clientWidth when offsetWidth is 0', () => {
    const el = document.createElement('div')
    Object.defineProperty(el, 'offsetWidth', { value: 0, configurable: true })
    Object.defineProperty(el, 'clientWidth', { value: 400, configurable: true })
    expect(handCardsContainerLayoutWidthPx(el)).toBe(400)
  })
})

describe('handCardsAllocatedHeightPx', () => {
  it('uses parent height when self is shorter than allocated row', () => {
    const parent = document.createElement('div')
    Object.defineProperty(parent, 'offsetHeight', { value: 160, configurable: true })
    const child = document.createElement('div')
    parent.appendChild(child)
    Object.defineProperty(child, 'offsetHeight', { value: 140, configurable: true })
    expect(handCardsAllocatedHeightPx(child)).toBe(160)
  })
})

describe('handCardsAllocatedWidthPx', () => {
  it('uses parent width when self is collapsed but parent has allocated space', () => {
    const parent = document.createElement('div')
    Object.defineProperty(parent, 'offsetWidth', { value: 520, configurable: true })
    Object.defineProperty(parent, 'clientWidth', { value: 520, configurable: true })
    const child = document.createElement('div')
    parent.appendChild(child)
    Object.defineProperty(child, 'offsetWidth', { value: 12, configurable: true })
    Object.defineProperty(child, 'clientWidth', { value: 12, configurable: true })
    expect(handCardsAllocatedWidthPx(child)).toBe(520)
  })

  it('matches self when self is already full parent width', () => {
    const parent = document.createElement('div')
    Object.defineProperty(parent, 'offsetWidth', { value: 400, configurable: true })
    const child = document.createElement('div')
    parent.appendChild(child)
    Object.defineProperty(child, 'offsetWidth', { value: 400, configurable: true })
    expect(handCardsAllocatedWidthPx(child)).toBe(400)
  })
})

describe('mobile rank stack collapse (prototype)', () => {
  it('slices to top visible cards when compact and collapsed', () => {
    const g = [c('1', '3'), c('2', '3'), c('3', '3'), c('4', '3'), c('5', '3')]
    const vis = visibleCardsForRankStack(g, true, MOBILE_RANK_STACK_COLLAPSED_VISIBLE, false)
    expect(vis).toHaveLength(4)
    expect(vis.map((x) => x.id).join(',')).toBe('2,3,4,5')
  })

  it('returns full group when expanded', () => {
    const g = [c('1', '5'), c('2', '5'), c('3', '5'), c('4', '5'), c('5', '5')]
    expect(visibleCardsForRankStack(g, true, MOBILE_RANK_STACK_COLLAPSED_VISIBLE, true)).toHaveLength(5)
  })

  it('computes overflow count', () => {
    const g = [c('a', '7'), c('b', '7'), c('c', '7'), c('d', '7'), c('e', '7')]
    expect(collapsedRankStackOverflowCount(g, true, MOBILE_RANK_STACK_COLLAPSED_VISIBLE, false)).toBe(1)
  })

  it('effective depth respects collapsed cap across columns', () => {
    const groups = [
      [c('1', 'K'), c('2', 'K')],
      [c('3', '3'), c('4', '3'), c('5', '3'), c('6', '3'), c('7', '3'), c('8', '3')],
    ]
    expect(
      effectiveMaxStackDepthForLayout(groups, true, MOBILE_RANK_STACK_COLLAPSED_VISIBLE, () => false),
    ).toBe(4)
    expect(
      effectiveMaxStackDepthForLayout(groups, true, MOBILE_RANK_STACK_COLLAPSED_VISIBLE, (gi) => gi === 1),
    ).toBe(6)
  })
})

describe('verticalStackDesignUnit', () => {
  it('is padding plus one card for depth 1', () => {
    expect(verticalStackDesignUnit(1)).toBe(10 + 12 + 85)
  })

  it('adds (cardH - overlap) per extra card in stack', () => {
    expect(verticalStackDesignUnit(2)).toBe(10 + 12 + 85 + (85 - 58))
  })
})

describe('handCardsOuterWidthUnit', () => {
  it('matches baseline geometry at ratio 1 (padding + columns + gaps)', () => {
    expect(handCardsOuterWidthUnit(1)).toBe(2 * 10 + 60 + 0)
    expect(handCardsOuterWidthUnit(14)).toBe(2 * 10 + 14 * 60 + 13 * 10)
  })

  it('is 0 for non-positive column count', () => {
    expect(handCardsOuterWidthUnit(0)).toBe(0)
  })
})

describe('computeHandCardLayout', () => {
  // 边界：宽度刚好等于基准单元 → ratio=1，像素与设计基准一致
  it('uses ratio 1 when outer width equals unit width', () => {
    const u = handCardsOuterWidthUnit(10)
    const m = computeHandCardLayout(u, 10)
    expect(m.ratio).toBeCloseTo(1, 5)
    expect(m.cardW).toBeCloseTo(60, 5)
    expect(m.gap).toBeCloseTo(10, 5)
  })

  // 边界：宽度减半 → 全系按比例缩小，保证单行容纳列数所需宽度
  it('scales down proportionally when viewport is narrower', () => {
    const u = handCardsOuterWidthUnit(12)
    const m = computeHandCardLayout(u / 2, 12)
    expect(m.ratio).toBeCloseTo(0.5, 5)
    expect(m.cardW).toBeCloseTo(30, 5)
    expect(m.stackOverlap).toBeCloseTo(29, 5)
  })

  // 边界：无列或无宽度 → 退回基准尺寸
  it('returns base dimensions when column count is 0', () => {
    const m = computeHandCardLayout(400, 0)
    expect(m.cardW).toBe(60)
    expect(m.ratio).toBe(1)
  })

  it('returns base dimensions when outer width is 0', () => {
    const m = computeHandCardLayout(0, 8)
    expect(m.cardW).toBe(60)
  })

  // 边界：极宽视口仍限制最大放大倍数（与 MAX_RATIO 一致）
  it('caps ratio when viewport is much wider than baseline width', () => {
    const u = handCardsOuterWidthUnit(5)
    const m = computeHandCardLayout(u * 20, 5)
    expect(m.ratio).toBeLessThanOrEqual(78 / 60 + 1e-9)
    expect(m.cardW).toBeLessThanOrEqual(78 + 1e-9)
  })

  // 边界：竖向空间不足时收紧 ratio（横屏手牌区）
  it('reduces ratio when maxAreaHeightPx is smaller than width-only ratio needs', () => {
    const cols = 6
    const u = handCardsOuterWidthUnit(cols)
    const wideOnly = computeHandCardLayout(u * 2, cols)
    const withHeight = computeHandCardLayout(u * 2, cols, {
      maxStackDepth: 8,
      maxAreaHeightPx: 100,
    })
    expect(withHeight.ratio).toBeLessThan(wideOnly.ratio)
    expect(withHeight.cardH).toBeLessThan(wideOnly.cardH)
  })

  // 边界：minRatio 抬高下限，避免竖向收紧把手牌缩得过小
  it('floors ratio when minRatio is provided', () => {
    const cols = 5
    const u = handCardsOuterWidthUnit(cols)
    const m = computeHandCardLayout(u * 3, cols, {
      maxStackDepth: 10,
      maxAreaHeightPx: 72,
      minRatio: HAND_CARD_MIN_RATIO,
    })
    expect(m.ratio).toBeGreaterThanOrEqual(HAND_CARD_MIN_RATIO - 1e-9)
    expect(m.cardW).toBeGreaterThanOrEqual(60 * HAND_CARD_MIN_RATIO - 1e-9)
  })
})
