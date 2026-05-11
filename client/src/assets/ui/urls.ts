/**
 * 集中导出 UI 图片资源 URL（Vite 会处理为最终线上地址）
 */
import type { CardSuit } from '@/types'
import jokerSmall from './joker-small.svg'
import jokerBig from './joker-big.svg'
import gameFelt from './game-felt-texture.svg'
import gameFeltPhoto from '../generated/felt-table-preview.png'
import portraitRotateHint from '../generated/portrait-rotate-hint.png'
import suitSpades from './suit-spades.svg'
import suitHearts from './suit-hearts.svg'
import suitDiamonds from './suit-diamonds.svg'
import suitClubs from './suit-clubs.svg'
import iconMenuHome from './icon-menu-home.svg'
import iconMenuJoin from './icon-menu-join.svg'
import avatarAi from './avatar-ai.png'
import avatarPlayer from './avatar-player.svg'
import iconBack from './icon-back.svg'
import iconVolumeOn from './icon-volume-on.svg'
import iconVolumeOff from './icon-volume-off.svg'
import themePanelHeaderWood from './theme/panel-header-wood.png'
import themeBtnPrimaryGloss from './theme/btn-primary-gloss.png'
import themePanelPlayerPlate from './theme/panel-player-plate.png'

export const ui = {
  jokerSmall,
  jokerBig,
  /** 矢量叠纹（可选）；主牌桌底图见 gameFeltPhoto */
  gameFelt,
  /** 生成绒面摄影素材，用于 GameBoard 背景 */
  gameFeltPhoto,
  /** 竖屏时横屏引导插画（欢乐斗地主向质感） */
  portraitRotateHint,
  iconMenuHome,
  iconMenuJoin,
  avatarAi,
  avatarPlayer,
  iconBack,
  iconVolumeOn,
  iconVolumeOff,
  /** 欢乐斗地主风：顶栏木纹、主按钮高光、玩家铭牌（房间等统计徽标用 CSS 渐变边框，避免位图白边） */
  themePanelHeaderWood,
  themeBtnPrimaryGloss,
  themePanelPlayerPlate,
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
