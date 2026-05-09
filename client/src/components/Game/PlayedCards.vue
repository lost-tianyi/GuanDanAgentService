<template>
  <div class="played-cards">
    <div
      v-for="entry in normalizedPlayedCards"
      :key="entry.key"
      class="position-cards"
      :class="entry.positionClass"
    >
      <div class="cards-container">
        <div
          v-if="entry.cards.length === 0"
          class="pass-chip"
          :class="`pass-chip--${entry.positionClass}`"
          aria-label="不出"
        >
          <!-- 中文用页面字体；外链 SVG 作 img 时 text 常缺字成 ?? -->
          <span class="pass-chip__rim" aria-hidden="true" />
          <span class="pass-chip__inner">
            <span class="pass-chip__text">不出</span>
          </span>
        </div>
        <template v-else>
          <div
            v-for="card in entry.cards"
            :key="card.id"
            class="card"
            :class="getCardClass(card)"
          >
            <div v-if="isJoker(card)" class="played-joker-face">
              <JokerCardArt :variant="jokerVariant(card)" />
            </div>
            <div class="played-card-label">
              <span>{{ getRankDisplay(card.rank) }}</span>
              <img
                v-if="suitImg(card)"
                class="played-suit-img"
                :src="suitImg(card)!"
                alt=""
                draggable="false"
              />
              <span v-else class="suit">{{ getSuitIcon(card) }}</span>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Card } from '@/types'
import { suitImageUrl } from '@/assets/ui/urls'
import JokerCardArt from '@/components/Game/JokerCardArt.vue'

const isJoker = (card: Card) => card.rank === 'SJ' || card.rank === 'BJ'

function jokerVariant(card: Card): 'SJ' | 'BJ' {
  return card.rank === 'BJ' ? 'BJ' : 'SJ'
}

const props = defineProps<{
  playedCards: Array<{
    position: number
    cards: Card[]
  }>
  myPlayerIndex?: number
}>()

const positionClassMap: Record<number, string> = {
  0: 'bottom',
  1: 'right',
  2: 'top',
  3: 'left',
}

/**
 * 同一座位若存在多条记录（异常或跨圈残留），只保留该座位最后一次操作，
 * 返回按时间顺序排列的步骤（避免「不出」与旧出牌在同一座位叠放）。
 */
function dedupePlayedBySeatLastWins(
  steps: Array<{ position: number; cards: Card[] }>,
): Array<{ position: number; cards: Card[] }> {
  const list = steps || []
  const lastIndexByPos = new Map<number, number>()
  for (let i = 0; i < list.length; i++) {
    lastIndexByPos.set(list[i].position, i)
  }
  const indices = [...lastIndexByPos.values()].sort((a, b) => a - b)
  return indices.map((i) => list[i])
}

const normalizedPlayedCards = computed(() =>
  dedupePlayedBySeatLastWins(props.playedCards || []).map((p, idx) => ({
    key: `${p.position}-${idx}`,
    cards: p.cards || [],
    positionClass: positionClassMap[((p.position - (props.myPlayerIndex || 0)) + 4) % 4] || 'top',
  })),
)

const getCardClass = (card: Card) => {
  if (card.rank === 'SJ') return { 'joker-small': true }
  if (card.rank === 'BJ') return { 'joker-big': true }
  const isRed = card.suit === 'hearts' || card.suit === 'diamonds'
  return {
    red: isRed,
    black: !isRed,
  }
}

const getRankDisplay = (rank: string) => {
  const map: Record<string, string> = { SJ: '小', BJ: '大' }
  return map[rank] || rank
}

const getSuitIcon = (card: Card) => {
  if (card.rank === 'SJ' || card.rank === 'BJ') return '王'
  const map: Record<string, string> = {
    spades: '♠',
    hearts: '♥',
    clubs: '♣',
    diamonds: '♦',
  }
  return map[card.suit] || ''
}

function suitImg(card: Card): string | null {
  if (card.rank === 'SJ' || card.rank === 'BJ') return null
  return suitImageUrl(card.suit)
}
</script>

<style scoped>
.played-cards {
  width: 100%;
  height: 100%;
  position: relative;
}

.position-cards {
  position: absolute;
}

.position-cards.top {
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
}

.position-cards.bottom {
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
}

.position-cards.left {
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
}

.position-cards.right {
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
}

.cards-container {
  display: flex;
  gap: 2px;
  align-items: center;
}

/* 「不出」：金框 + 页面内嵌汉字（避免外链 SVG 作 img 时文字变 ??） */
.pass-chip {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
  border-radius: 11px;
  background: linear-gradient(
    165deg,
    #fff6d4 0%,
    #e8c456 22%,
    #b8860b 52%,
    #7a5a12 78%,
    #caa035 100%
  );
  box-shadow:
    0 0 14px rgba(255, 190, 60, 0.38),
    0 4px 14px rgba(0, 0, 0, 0.55),
    inset 0 1px 0 rgba(255, 255, 255, 0.45);
  filter: drop-shadow(0 3px 10px rgba(0, 0, 0, 0.35));
  animation: pass-chip-enter 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

.pass-chip__rim {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  background: linear-gradient(
    125deg,
    rgba(255, 255, 255, 0.55) 0%,
    transparent 42%,
    transparent 58%,
    rgba(255, 255, 255, 0.12) 100%
  );
  opacity: 0.85;
}

.pass-chip__inner {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 56px;
  padding: 8px 14px;
  border-radius: 9px;
  background: linear-gradient(180deg, #1c1512 0%, #0d0a09 48%, #050403 100%);
  border: 1px solid rgba(255, 210, 120, 0.28);
  box-shadow:
    inset 0 2px 6px rgba(0, 0, 0, 0.65),
    inset 0 -1px 0 rgba(255, 200, 80, 0.06);
}

.pass-chip__text {
  font-size: 15px;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-indent: 0.14em;
  color: #fff4d4;
  text-shadow:
    0 1px 0 rgba(0, 0, 0, 0.95),
    0 2px 4px rgba(0, 0, 0, 0.55),
    0 0 12px rgba(255, 200, 100, 0.35);
}

.pass-chip--bottom .pass-chip__inner {
  min-width: 62px;
  padding: 9px 16px;
}

.pass-chip--bottom .pass-chip__text {
  font-size: 16px;
}

@keyframes pass-chip-enter {
  0% {
    opacity: 0;
    transform: scale(0.82);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .pass-chip {
    animation: none;
  }
}

.position-cards.left .cards-container,
.position-cards.right .cards-container {
  flex-direction: column;
}

.card {
  position: relative;
  width: 36px;
  height: 50px;
  background: #fff;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.card.red { color: #e74c3c; }
.card.black { color: #2c3e50; }

.played-joker-face {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.played-card-label {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1px;
}

.card.joker-small .played-card-label,
.card.joker-big .played-card-label {
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.75);
}

.card.joker-small,
.card.joker-big {
  background: transparent;
}

.card .suit {
  font-size: 12px;
  margin-left: 2px;
}

.played-suit-img {
  width: 11px;
  height: 11px;
  margin-left: 1px;
  object-fit: contain;
}
</style>
