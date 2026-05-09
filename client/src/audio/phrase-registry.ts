import type { CardPattern } from '../types'

/** 与 play-announce / 服务端 judge 的 mainValue 一致 */
export function rankSpeech(mainValue: number): string {
  if (mainValue >= 100) return ''
  if (mainValue === 16) return '小王'
  if (mainValue === 17) return '大王'
  const m: Record<number, string> = {
    3: '三',
    4: '四',
    5: '五',
    6: '六',
    7: '七',
    8: '八',
    9: '九',
    10: '十',
    11: '钩',
    12: '圈',
    13: '凯',
    14: '尖',
    15: '二',
  }
  return m[mainValue] ?? ''
}

const MAIN_VALUES = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17] as const

/** 出牌短语：资源键 + 与生成脚本一致的朗读文案 */
export function phraseForCardPattern(pattern: CardPattern): { key: string; text: string } {
  const { type, mainValue, cards } = pattern
  const r = rankSpeech(mainValue)
  const n = cards.length

  switch (type) {
    case 'single':
      return { key: `single_mv_${mainValue}`, text: r ? `单张，${r}` : '单张' }
    case 'pair':
      return { key: `pair_mv_${mainValue}`, text: r ? `对${r}` : '对子' }
    case 'triple':
      return { key: `triple_mv_${mainValue}`, text: r ? `三个${r}` : '三张' }
    case 'triple_with_pair':
      return { key: 'triple_with_pair', text: '三带二' }
    case 'straight':
      return { key: `straight_mv_${mainValue}`, text: r ? `顺子，${r}` : '顺子' }
    case 'straight_pair':
      return { key: `straight_pair_mv_${mainValue}`, text: r ? `连对，${r}` : '连对' }
    case 'triple_run':
      return { key: `triple_run_mv_${mainValue}`, text: r ? `钢板，${r}` : '钢板' }
    case 'bomb':
      return { key: `bomb_${n}_mv_${mainValue}`, text: r ? `${n}张炸弹，${r}` : `${n}张炸弹` }
    case 'straight_bomb':
      return { key: `straight_bomb_mv_${mainValue}`, text: r ? `同花顺，${r}` : '同花顺' }
    case 'joker_bomb':
      return { key: 'joker_bomb', text: '王炸' }
    default:
      return { key: 'fallback_play', text: '出牌' }
  }
}

export function phraseForPass(): { key: string; text: string } {
  return { key: 'pass_skip', text: '跳过' }
}

/**
 * 批量生成音频文件时使用的完整键值列表（去重）。
 * 覆盖规则内可能出现的 mainValue / 张数组合。
 */
export function allPhraseAssetEntries(): { key: string; text: string }[] {
  const map = new Map<string, string>()

  const add = (key: string, text: string) => {
    if (!map.has(key)) map.set(key, text)
  }

  add(phraseForPass().key, phraseForPass().text)
  add('triple_with_pair', '三带二')
  add('joker_bomb', '王炸')
  add('fallback_play', '出牌')

  for (const mv of MAIN_VALUES) {
    const r = rankSpeech(mv)
    add(`single_mv_${mv}`, r ? `单张，${r}` : '单张')
    add(`pair_mv_${mv}`, r ? `对${r}` : '对子')
    add(`triple_mv_${mv}`, r ? `三个${r}` : '三张')
    add(`straight_mv_${mv}`, r ? `顺子，${r}` : '顺子')
    add(`straight_pair_mv_${mv}`, r ? `连对，${r}` : '连对')
    add(`triple_run_mv_${mv}`, r ? `钢板，${r}` : '钢板')
    add(`straight_bomb_mv_${mv}`, r ? `同花顺，${r}` : '同花顺')
  }

  for (let n = 4; n <= 10; n++) {
    for (const mv of MAIN_VALUES) {
      if (mv > 15) continue
      const r = rankSpeech(mv)
      add(`bomb_${n}_mv_${mv}`, r ? `${n}张炸弹，${r}` : `${n}张炸弹`)
    }
  }

  return [...map.entries()].map(([key, text]) => ({ key, text }))
}
