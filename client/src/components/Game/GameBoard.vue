<template>
  <div class="game-board">
    <div class="game-board__surface" :style="boardSurfaceStyle" aria-hidden="true" />
    <div class="game-board__content">
    <div class="top-player">
      <PlayerInfo 
        :player="players.top" 
        :is-current="currentPlayerIndex === topIndex"
        position="top" 
      />
    </div>

    <div class="middle-row">
      <div class="left-player">
        <PlayerInfo 
          :player="players.left" 
          :is-current="currentPlayerIndex === leftIndex"
          position="left" 
        />
      </div>

      <div class="center-area">
        <PlayedCards :played-cards="playedCards" :my-player-index="myPlayerIndex" />
      </div>

      <div class="right-player">
        <PlayerInfo 
          :player="players.right" 
          :is-current="currentPlayerIndex === rightIndex"
          position="right" 
        />
      </div>
    </div>

    <div v-if="!detachBottomPlayer" class="bottom-player">
        <div class="my-cards">
        <HandCards 
          :cards="myCards"
          :selected-cards="selectedCards"
          :selectable="handSelectable"
          :level-rank="gameState.levelRank"
          @select="handleSelectCard"
          @add-to-selection="handleAddToSelection"
        />
      </div>
      <div v-if="$slots['bottom-actions']" class="bottom-actions">
        <slot name="bottom-actions" />
      </div>
    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ui } from '@/assets/ui/urls'
import PlayerInfo from '@/components/Game/PlayerInfo.vue'
import HandCards from '@/components/Game/HandCards.vue'
import PlayedCards from '@/components/Game/PlayedCards.vue'
import type { GameState, Card, Player } from '@/types'

const props = withDefaults(
  defineProps<{
    gameState: GameState
    selectedCards: Card[]
    myPlayerId: string
    /** 托管等场景下禁止本地选牌 */
    handSelectable?: boolean
    /** 手机横屏壳层：手牌与 bottom-actions 由父级 player-zone 承载 */
    detachBottomPlayer?: boolean
  }>(),
  { handSelectable: true, detachBottomPlayer: false },
)

const emit = defineEmits<{
  (e: 'select-card', card: Card): void
  (e: 'add-to-selection', card: Card): void
  (e: 'play-cards'): void
  (e: 'pass'): void
}>()

const myPlayerIndex = computed(() => {
  const idx = props.gameState.players.findIndex((p) => p.id === props.myPlayerId)
  return idx >= 0 ? idx : 0
})

const players = computed(() => {
  const list = props.gameState.players
  const myIdx = myPlayerIndex.value
  const getAtOffset = (offset: number) => list[(myIdx + offset) % 4]
  return {
    bottom: getAtOffset(0) || createEmptyPlayer(),
    right: getAtOffset(1) || createEmptyPlayer(),
    top: getAtOffset(2) || createEmptyPlayer(),
    left: getAtOffset(3) || createEmptyPlayer()
  }
})

const myCards = computed(() => {
  return props.gameState.players.find((p) => p.id === props.myPlayerId)?.cards || []
})
const currentPlayerIndex = computed(() => props.gameState.currentPlayerIndex)
const topIndex = computed(() => (myPlayerIndex.value + 2) % 4)
const rightIndex = computed(() => (myPlayerIndex.value + 1) % 4)
const leftIndex = computed(() => (myPlayerIndex.value + 3) % 4)
const playedCards = computed(() => props.gameState.playedCards)

/**
 * 牌桌底纹：底层照片 cover 保持比例；渐变层 100% 铺满叠色。
 * 使用 container 查询微调 focal，减轻宽屏/竖屏裁切违和感。
 */
const boardSurfaceStyle = computed(() => ({
  backgroundImage: [
    'radial-gradient(circle at center, var(--ui-board-radial) 0%, transparent 68%)',
    'linear-gradient(135deg, var(--ui-board-linear-start) 0%, var(--ui-board-linear-end) 100%)',
    `url(${ui.gameFeltPhoto})`,
  ].join(', '),
  backgroundSize: '100% 100%, 100% 100%, cover',
  backgroundRepeat: 'no-repeat, no-repeat, no-repeat',
}))

const createEmptyPlayer = (): Player => ({
  id: '',
  name: '等待加入',
  position: 'bottom',
  isAI: false,
  cards: [],
  isReady: false,
  isOnline: true,
  level: 2
})

const handleSelectCard = (card: Card) => {
  emit('select-card', card)
}

const handleAddToSelection = (card: Card) => {
  emit('add-to-selection', card)
}
</script>

<style scoped>
.game-board {
  flex: 1 1 0;
  min-height: 0;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  container-type: size;
  container-name: game-board;
}

/* 背景单独一层：cover 相对整块牌桌区域，避免与内边距/子元素 flex 高度耦合 */
.game-board__surface {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  z-index: 0;
  background-position: center, center, center 45%;
}

.game-board__content {
  position: relative;
  z-index: 1;
  flex: 1 1 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 20px;
  box-sizing: border-box;
}

/* 暖色叠层与 container focal：竖窄牌桌略上移第三层焦点，避免违和（与 tasks 4.2 目视一致） */
@container game-board (max-aspect-ratio: 0.65) {
  .game-board__surface {
    background-position: center, center, center 34%;
  }
}

@container game-board (min-aspect-ratio: 1.75) {
  .game-board__surface {
    background-position: center, center, center 50%;
  }
}

.game-board__content .top-player {
  height: 80px;
  display: flex;
  justify-content: center;
}

.game-board__content .middle-row {
  flex: 1;
  display: flex;
  min-height: 0;
}

.game-board__content .left-player,
.game-board__content .right-player {
  width: 150px;
  display: flex;
  align-items: center;
}

.game-board__content .left-player {
  justify-content: flex-start;
}

.game-board__content .right-player {
  justify-content: flex-end;
}

.game-board__content .center-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.game-board__content .bottom-player {
  min-height: 180px;
  padding-top: 10px;
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  justify-content: center;
  gap: 8px 12px;
  flex-wrap: nowrap;
}

.game-board__content .my-cards {
  flex: 1;
  min-width: 0;
  height: 100%;
  display: flex;
  justify-content: center;
}

.game-board__content .bottom-actions {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: flex-end;
  padding-bottom: 2px;
}
</style>
