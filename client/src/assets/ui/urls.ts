/**
 * 集中导出 UI 图片资源 URL（Vite 会处理为最终线上地址）
 */
import type { CardSuit } from '@/types'
import jokerSmall from './joker-small.svg'
import jokerBig from './joker-big.svg'
import gameFelt from './game-felt-texture.svg'
import suitSpades from './suit-spades.svg'
import suitHearts from './suit-hearts.svg'
import suitDiamonds from './suit-diamonds.svg'
import suitClubs from './suit-clubs.svg'
import iconMenuAi from './icon-menu-ai.svg'
import iconMenuHome from './icon-menu-home.svg'
import iconMenuJoin from './icon-menu-join.svg'
import avatarAi from './avatar-ai.svg'
import avatarPlayer from './avatar-player.svg'
import iconBack from './icon-back.svg'
import iconVolumeOn from './icon-volume-on.svg'
import iconVolumeOff from './icon-volume-off.svg'

export const ui = {
  jokerSmall,
  jokerBig,
  gameFelt,
  iconMenuAi,
  iconMenuHome,
  iconMenuJoin,
  avatarAi,
  avatarPlayer,
  iconBack,
  iconVolumeOn,
  iconVolumeOff,
} as const

const suitByKey: Record<Exclude<CardSuit, 'joker'>, string> = {
  spades: suitSpades,
  hearts: suitHearts,
  diamonds: suitDiamonds,
  clubs: suitClubs,
}

/** 普通花色牌角标 / 中央花色图；王牌返回 null */
export function suitImageUrl(suit: CardSuit): string | null {
  if (suit === 'joker') return null
  return suitByKey[suit]
}
