/**
 * 手牌区横向：多列 rank-stack，固定 px 时在窄屏下会换行。
 * 用「设计基准尺寸」与列数推出统一缩放比 ratio，使总宽度贴合容器。
 */

import type { Card } from '@/types'

const BASE_CARD_W = 60
const BASE_CARD_H = 85
const BASE_STACK_OVERLAP = 58
const BASE_GAP = 10
/** 左右各一侧的内边距基准（与 HandCards 原 padding 一致） */
const BASE_PAD_H = 10
const BASE_PAD_TOP = 10
const BASE_PAD_BOTTOM = 12

/** 相对基准宽度，避免大屏下手牌过大 */
const MAX_RATIO = 78 / BASE_CARD_W

/**
 * 逻辑画布内手牌最小缩放：避免与固定 px 的出牌按钮、玩家头像相比过小。
 * 超出可用高度时由 `.hand-cards` 滚动承接。
 */
export const HAND_CARD_MIN_RATIO = 0.62

/** 手机横屏紧凑叠牌：默认只铺可视顶层张数，其余「+N」展开（原型） */
export const MOBILE_RANK_STACK_COLLAPSED_VISIBLE = 4

/**
 * 折叠模式下每列只渲染最后 `maxCollapsedVisible` 张（牌力排序后数组尾部 = 叠在上方的牌）。
 */
export function visibleCardsForRankStack(
  group: Card[],
  compact: boolean,
  maxCollapsedVisible: number,
  stackExpanded: boolean,
): Card[] {
  if (!compact || stackExpanded || group.length <= maxCollapsedVisible) {
    return group
  }
  return group.slice(-maxCollapsedVisible)
}

export function collapsedRankStackOverflowCount(
  group: Card[],
  compact: boolean,
  maxCollapsedVisible: number,
  stackExpanded: boolean,
): number {
  if (!compact || stackExpanded) return 0
  return Math.max(0, group.length - maxCollapsedVisible)
}

/** 供竖向 ratio / maxAreaHeightPx 使用的「有效最高叠深」（折叠列按可视张数计） */
export function effectiveMaxStackDepthForLayout(
  groups: Card[][],
  compact: boolean,
  maxCollapsedVisible: number,
  isStackExpanded: (gi: number) => boolean,
): number {
  if (groups.length === 0) return 1
  let m = 1
  groups.forEach((g, gi) => {
    const depth =
      !compact || isStackExpanded(gi)
        ? g.length
        : Math.min(g.length, maxCollapsedVisible)
    m = Math.max(m, depth)
  })
  return m
}

export type HandCardLayoutMetrics = {
  ratio: number
  cardW: number
  cardH: number
  stackOverlap: number
  gap: number
  padH: number
  padTop: number
  padBottom: number
}

/**
 * 与 `computeHandCardLayout` 的基准宽度同一坐标系（CSS 布局 px）。
 * 祖先节点若有 `transform: scale(...)`，`getBoundingClientRect().width` 会变成屏幕像素，
 * 会导致比例严重偏小；应使用 offsetWidth / clientWidth。
 */
export function handCardsContainerLayoutWidthPx(el: HTMLElement): number {
  const ow = el.offsetWidth
  if (ow > 0) return ow
  const cw = el.clientWidth
  if (cw > 0) return cw
  return 0
}

/**
 * 手牌根节点在 GameBoard 内为 flex 子项：若未设 `width:100%`，宽度会随「已缩小」的内容收缩，
 * `offsetWidth` 与比例计算形成负反馈。测量时应取根节点与父容器（`.my-cards`）分配宽度中的较大值。
 */
export function handCardsAllocatedWidthPx(handRoot: HTMLElement): number {
  const self = handCardsContainerLayoutWidthPx(handRoot)
  const parent = handRoot.parentElement
  const parentW = parent ? handCardsContainerLayoutWidthPx(parent) : 0
  return Math.max(self, parentW)
}

export function handCardsContainerLayoutHeightPx(el: HTMLElement): number {
  const oh = el.offsetHeight
  if (oh > 0) return oh
  const ch = el.clientHeight
  if (ch > 0) return ch
  return 0
}

/** 与 `handCardsAllocatedWidthPx` 同理：取父 `.my-cards` 分配高度，避免随内容塌陷。 */
export function handCardsAllocatedHeightPx(handRoot: HTMLElement): number {
  const self = handCardsContainerLayoutHeightPx(handRoot)
  const parent = handRoot.parentElement
  const parentH = parent ? handCardsContainerLayoutHeightPx(parent) : 0
  return Math.max(self, parentH)
}

/** ratio=1 时，手牌区主题横向所占宽度（含左右 padding、列宽、列间 gap） */
export function handCardsOuterWidthUnit(columnCount: number): number {
  if (columnCount <= 0) return 0
  return (
    2 * BASE_PAD_H + columnCount * BASE_CARD_W + Math.max(0, columnCount - 1) * BASE_GAP
  )
}

/**
 * 设计稿坐标下，单列叠 `maxStackDepth` 张牌时的竖向总高度（含上下 padding）。
 * 与 `.rank-stack` 内 margin 叠放规则一致。
 */
export function verticalStackDesignUnit(maxStackDepth: number): number {
  const d = Math.max(1, maxStackDepth)
  const stackH =
    BASE_CARD_H + Math.max(0, d - 1) * (BASE_CARD_H - BASE_STACK_OVERLAP)
  return BASE_PAD_TOP + BASE_PAD_BOTTOM + stackH
}

export type ComputeHandCardLayoutOptions = {
  /** 单列最大张数，用于竖向高度上限（横屏矮视口） */
  maxStackDepth?: number
  /** 手牌区可用高度（布局 px，与 offsetHeight 同源） */
  maxAreaHeightPx?: number
  /**
   * 缩放比下限（如横屏 `HAND_CARD_MIN_RATIO`），避免手牌相对固定 px 控件过小；
   * 未设置时宽度过窄仍可缩小以适配列数。
   */
  minRatio?: number
}

/**
 * @param outerWidthPx `.hand-cards` 元素整体宽度（布局 px）
 * @param columnRankStacks rank-stack 列数（同点数为一列）
 */
export function computeHandCardLayout(
  outerWidthPx: number,
  columnRankStacks: number,
  options?: ComputeHandCardLayoutOptions,
): HandCardLayoutMetrics {
  const base = (): HandCardLayoutMetrics => ({
    ratio: 1,
    cardW: BASE_CARD_W,
    cardH: BASE_CARD_H,
    stackOverlap: BASE_STACK_OVERLAP,
    gap: BASE_GAP,
    padH: BASE_PAD_H,
    padTop: BASE_PAD_TOP,
    padBottom: BASE_PAD_BOTTOM,
  })

  if (columnRankStacks <= 0 || outerWidthPx <= 0 || !Number.isFinite(outerWidthPx)) {
    return base()
  }

  const innerUnit = handCardsOuterWidthUnit(columnRankStacks)
  let ratio = outerWidthPx / innerUnit
  if (!Number.isFinite(ratio) || ratio <= 0) ratio = 1
  ratio = Math.min(MAX_RATIO, ratio)

  const maxStack = Math.max(1, options?.maxStackDepth ?? 1)
  const maxH = options?.maxAreaHeightPx
  if (maxH !== undefined && maxH > 0 && Number.isFinite(maxH)) {
    const vu = verticalStackDesignUnit(maxStack)
    if (vu > 0) {
      const ratioH = maxH / vu
      if (Number.isFinite(ratioH) && ratioH > 0) {
        ratio = Math.min(ratio, ratioH)
      }
    }
  }

  const floor = options?.minRatio
  if (floor !== undefined && floor > 0 && Number.isFinite(floor)) {
    ratio = Math.max(floor, ratio)
  }

  return {
    ratio,
    cardW: BASE_CARD_W * ratio,
    cardH: BASE_CARD_H * ratio,
    stackOverlap: BASE_STACK_OVERLAP * ratio,
    gap: BASE_GAP * ratio,
    padH: BASE_PAD_H * ratio,
    padTop: BASE_PAD_TOP * ratio,
    padBottom: BASE_PAD_BOTTOM * ratio,
  }
}
