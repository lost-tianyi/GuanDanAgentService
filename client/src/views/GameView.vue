<template>
  <div class="game-container" :style="themeCssVars">
    <div class="game-header">
      <div class="room-info">
        <span class="stat-chip"
          ><span class="stat-chip__k">房间</span><span class="stat-chip__v">{{ displayRoomId }}</span></span
        >
        <span class="stat-chip"
          ><span class="stat-chip__k">等级</span><span class="stat-chip__v">{{ currentLevel }}</span></span
        >
        <span class="stat-chip"
          ><span class="stat-chip__k">级牌</span><span class="stat-chip__v">{{ levelRankLabel }}</span></span
        >
        <span class="stat-chip"
          ><span class="stat-chip__k">回合</span><span class="stat-chip__v">{{ roundNumber }}</span></span
        >
        <span v-if="store.gameState.status === 'tribute'" class="stat-chip stat-chip--phase"
          ><span class="stat-chip__v">进贡/还牌</span></span
        >
      </div>
      <button type="button" class="back-btn" @click="goHome">
        <img class="back-btn__icon" :src="ui.iconBack" alt="" width="18" height="18" draggable="false" />
        返回
      </button>
    </div>

    <div class="game-area">
      <GameBoard
        :game-state="store.gameState"
        :selected-cards="store.selectedCards"
        :my-player-id="store.playerId"
        :hand-selectable="handSelectable"
        @select-card="handleSelectCard"
        @add-to-selection="handleAddToSelection"
        @play-cards="handlePlayCards"
        @pass="handlePass"
      >
        <template v-if="showCoachHint" #bottom-actions>
          <div class="coach-switch-row" role="tablist" aria-label="手牌与教练切换">
            <button
              type="button"
              class="coach-switch-btn"
              :class="{ active: coachShell === 'hand' }"
              role="tab"
              :aria-selected="coachShell === 'hand'"
              @click="coachShell = 'hand'"
            >
              手牌
            </button>
            <button
              type="button"
              class="coach-switch-btn"
              :class="{ active: coachShell === 'coach' }"
              role="tab"
              :aria-selected="coachShell === 'coach'"
              @click="coachShell = 'coach'"
            >
              教练提示
            </button>
          </div>
        </template>
      </GameBoard>
    </div>

    <Teleport to="body">
      <Transition name="coach-float">
        <div
          v-if="showCoachHint && coachShell === 'coach'"
          class="coach-float-layer"
          aria-modal="true"
          role="dialog"
          aria-labelledby="coach-float-title"
        >
          <div class="coach-float-backdrop" @click="coachShell = 'hand'" />
          <div class="coach-float-sheet">
            <div class="coach-float-header">
              <h2 id="coach-float-title" class="coach-float-title">教练提示</h2>
              <div class="coach-float-header-actions">
                <button
                  type="button"
                  class="coach-float-accept"
                  :disabled="!canAcceptCoachSuggestion"
                  @click="acceptCoachSuggestion"
                >
                  接受建议
                </button>
                <button type="button" class="coach-float-back" @click="coachShell = 'hand'">返回手牌</button>
              </div>
            </div>
            <CoachHintPanel
              floating
              :visible="true"
              :loading="store.coachHintState.loading"
              :reason-streaming="store.coachHintState.reasonStreaming"
              :recommended="store.coachHintState.recommended"
              :reason="store.coachHintState.reason"
              :confidence="store.coachHintState.confidence"
              :error-message="store.coachHintState.errorMessage"
              @request="handleCoachHint"
            />
          </div>
        </div>
      </Transition>
    </Teleport>

    <div v-if="store.gameState.status === 'tribute'" class="tribute-hint">
      <p v-if="store.currentTributeStep">
        {{ tributePhaseDescription }}
      </p>
      <div class="tribute-actions">
        <button
          class="control-btn tribute"
          :disabled="store.selectedCards.length !== 1 || !store.isMyTributeTurn || tributeSubmitBlocked"
          @click="handleSubmitTribute"
        >
          {{ tributeButtonLabel }}
        </button>
        <button
          v-if="canToggleAutoPlay"
          type="button"
          class="control-btn auto-play"
          data-testid="btn-auto-play-tribute"
          @click="toggleAutoPlay"
        >
          {{ store.autoPlayEnabled ? '取消托管' : '托管' }}
        </button>
      </div>
    </div>

    <div v-else class="game-controls">
      <button
        type="button"
        class="control-btn play"
        data-testid="btn-play-cards"
        :disabled="store.selectedCards.length === 0 || !canPlay"
        @click="handlePlayCards"
      >
        出牌
      </button>
      <button type="button" class="control-btn pass" data-testid="btn-pass" :disabled="!canPass" @click="handlePass">
        不出
      </button>
      <button
        v-if="canToggleAutoPlay"
        type="button"
        class="control-btn auto-play"
        data-testid="btn-auto-play"
        @click="toggleAutoPlay"
      >
        {{ store.autoPlayEnabled ? '取消托管' : '托管' }}
      </button>
    </div>

    <ChatWindow
      :messages="store.messages"
      :my-player-id="store.playerId"
      @send-message="handleSendMessage"
      @send-emoji="handleSendEmoji"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ui } from '@/assets/ui/urls'
import GameBoard from '@/components/Game/GameBoard.vue'
import ChatWindow from '@/components/Chat/ChatWindow.vue'
import CoachHintPanel from '@/components/Game/CoachHintPanel.vue'
import type { Card, CoachHintMode } from '@/types'
import { matchHandToCoachLabels } from '@/utils/coach-card-match'
import { useSocket } from '@/composables/useSocket'
import { useGameStore } from '@/stores/game'

const route = useRoute()
const router = useRouter()
const store = useGameStore()
const socketApi = useSocket()

const localRoomId = `LOCAL-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
const routeRoomId = ref((route.query.room as string) || localRoomId)
const mode = ref((route.query.mode as string) || 'local')
const difficulty = ref((route.query.difficulty as string) || 'normal')
const playerName = ref((route.query.name as string) || '玩家')

const currentLevel = computed(() => store.gameState.currentLevel)
const levelRankLabel = computed(() => {
  const r = store.gameState.levelRank
  const suit = '♥'
  return r ? `${suit}${r}` : '—'
})
const roundNumber = computed(() => store.gameState.roundNumber)
const displayRoomId = computed(() => store.roomId || routeRoomId.value)

const themeCssVars = computed(() => ({
  '--ui-theme-wood': `url(${ui.themePanelHeaderWood})`,
  '--ui-theme-btn-gloss': `url(${ui.themeBtnPrimaryGloss})`,
}))

const canPlay = computed(() => {
  if (store.gameState.status !== 'playing' || !store.isMyTurn) return false
  if (store.autoPlayEnabled) return false
  return true
})
const canPass = computed(() => {
  if (store.gameState.status !== 'playing' || store.gameState.lastPlayerIndex === -1 || !store.isMyTurn) return false
  if (store.autoPlayEnabled) return false
  return true
})

/** 托管开启且轮到本人时，禁止手动进贡确认（避免与代打冲突） */
const tributeSubmitBlocked = computed(() => store.autoPlayEnabled && store.isMyTributeTurn)

const handSelectable = computed(() => {
  if (!store.autoPlayEnabled) return true
  if (store.gameState.status === 'playing' && store.isMyTurn) return false
  if (store.gameState.status === 'tribute' && store.isMyTributeTurn) return false
  return true
})

const canToggleAutoPlay = computed(() => {
  if (!store.myPlayer || store.myPlayer.isAI) return false
  return store.gameState.status === 'playing' || store.gameState.status === 'tribute'
})

const tributePhaseDescription = computed(() => {
  const step = store.currentTributeStep
  if (!step) return ''
  const from = store.gameState.players[step.from]?.name ?? `座位${step.from}`
  const to = store.gameState.players[step.to]?.name ?? `座位${step.to}`
  return step.type === 'tribute'
    ? `${from} 向 ${to} 进贡（须选手中最大牌，红心级牌不可进贡）`
    : `${from} 向 ${to} 还牌（有 10 及以下时须选其中一张；否则还最小的一张）`
})

const tributeButtonLabel = computed(() => {
  const step = store.currentTributeStep
  if (!step) return '确认'
  return step.type === 'tribute' ? '确认进贡' : '确认还牌'
})

const showCoachHint = computed(() => {
  return (
    mode.value === 'local' &&
    store.gameState.status === 'playing' &&
    store.isMyTurn &&
    !!store.myPlayer &&
    !store.myPlayer.isAI &&
    !store.autoPlayEnabled
  )
})

/** 手牌界面 vs 教练悬浮层；不占用主布局高度 */
const coachShell = ref<'hand' | 'coach'>('hand')

/** 已有推荐结果时可接受（含「不出」：仅返回手牌并清空选中） */
const canAcceptCoachSuggestion = computed(() => {
  return !!store.coachHintState.recommended && !store.coachHintState.errorMessage
})

function acceptCoachSuggestion() {
  coachShell.value = 'hand'
  const rec = store.coachHintState.recommended
  if (!rec) {
    store.clearSelection()
    return
  }
  if (rec.action === 'pass') {
    store.clearSelection()
    return
  }
  const hand = store.myPlayer?.cards ?? []
  const matched = matchHandToCoachLabels(rec.cards, hand)
  if (!matched) {
    store.clearSelection()
    return
  }
  store.replaceSelection(matched)
}

watch(showCoachHint, (ok) => {
  if (!ok) coachShell.value = 'hand'
})

watch(
  () => [showCoachHint.value, coachShell.value] as const,
  () => {
    const lock = showCoachHint.value && coachShell.value === 'coach'
    document.body.style.overflow = lock ? 'hidden' : ''
  },
  { flush: 'post' },
)

function onCoachEscape(e: KeyboardEvent) {
  if (e.key !== 'Escape') return
  if (showCoachHint.value && coachShell.value === 'coach') {
    coachShell.value = 'hand'
  }
}

onBeforeUnmount(() => {
  document.body.style.overflow = ''
  window.removeEventListener('keydown', onCoachEscape)
})

const goHome = () => {
  socketApi.disconnect()
  router.push('/')
}

const handleSelectCard = (card: Card) => {
  store.selectCard(card)
}

const handleAddToSelection = (card: Card) => {
  store.addCardToSelection(card)
}

const handlePlayCards = async () => {
  const room = store.roomId || routeRoomId.value
  if (!room) return
  const result = await socketApi.playCards(room, store.selectedCards)
  if (result?.success) {
    store.resetCoachHint()
  }
}

const handlePass = async () => {
  const room = store.roomId || routeRoomId.value
  if (!room) return
  const result = await socketApi.pass(room)
  if (result?.success) {
    store.resetCoachHint()
  }
}

async function toggleAutoPlay() {
  const room = store.roomId || routeRoomId.value
  if (!room) return
  await socketApi.setAutoPlay(room, !store.autoPlayEnabled)
}

const handleSubmitTribute = async () => {
  const room = store.roomId || routeRoomId.value
  const card = store.selectedCards[0]
  if (!room || !card) return
  await socketApi.submitTribute(room, card.id)
}

const handleCoachHint = (mode: CoachHintMode) => {
  const room = store.roomId || routeRoomId.value
  if (!room) return
  socketApi.requestCoachHint(room, mode)
}

const handleSendMessage = (content: string) => {
  const room = store.roomId || routeRoomId.value
  if (!room) return
  socketApi.sendMessage(room, content)
}

const handleSendEmoji = (emoji: string) => {
  const room = store.roomId || routeRoomId.value
  if (!room) return
  socketApi.sendEmoji(room, emoji)
}

onMounted(async () => {
  window.addEventListener('keydown', onCoachEscape)
  socketApi.connect()
  if (mode.value === 'local') {
    const created = await socketApi.createRoom(routeRoomId.value, playerName.value, difficulty.value, 'local')
    if (created?.success) {
      await socketApi.startGame(routeRoomId.value)
    }
    return
  }

  const action = route.query.action as string | undefined
  if (action === 'create') {
    const created = await socketApi.createRoom(routeRoomId.value, playerName.value, difficulty.value, 'online')
    if (created?.success) {
      await socketApi.startGame(routeRoomId.value)
    }
  } else {
    await socketApi.joinRoom(routeRoomId.value, playerName.value)
  }
})
</script>

<style scoped>
.game-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 1200px;
  margin: 0 auto;
  padding: 10px;
}

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 18px;
  border-radius: 12px;
  margin-bottom: 10px;
  border: 1px solid var(--ui-chrome-border-soft);
  box-shadow: inset 0 1px 0 rgba(255, 200, 120, 0.12);
  background-image: var(--ui-theme-wood), linear-gradient(180deg, rgba(55, 42, 30, 0.92) 0%, rgba(38, 28, 20, 0.97) 100%);
  background-size: auto 140%, 100% 100%;
  background-position: top center, center;
  background-repeat: repeat-x, no-repeat;
}

.room-info {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 12px;
  color: rgba(255, 236, 210, 0.88);
}

.stat-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  min-height: 30px;
  font-size: 13px;
  line-height: 1.2;
  border-radius: 999px;
  border: 2px solid transparent;
  background:
    linear-gradient(180deg, rgba(38, 28, 20, 0.94) 0%, rgba(22, 16, 12, 0.97) 100%) padding-box,
    linear-gradient(145deg, #fff1c8 0%, #e8b535 38%, #a97212 72%, #6b4810 100%) border-box;
  background-clip: padding-box, border-box;
  box-shadow:
    inset 0 1px 0 rgba(255, 230, 200, 0.14),
    0 2px 8px rgba(0, 0, 0, 0.35);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.65);
}

.stat-chip--phase {
  background:
    linear-gradient(180deg, rgba(48, 36, 22, 0.94) 0%, rgba(32, 24, 14, 0.97) 100%) padding-box,
    linear-gradient(145deg, #ffe8a8 0%, #f0a030 45%, #c97808 100%) border-box;
  background-clip: padding-box, border-box;
}

.stat-chip__k {
  opacity: 0.82;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.stat-chip__v {
  font-weight: 700;
  color: rgba(255, 252, 245, 0.98);
}

.stat-chip--phase .stat-chip__v {
  color: var(--warning-color, #ffc53d);
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1px solid var(--ui-chrome-border-soft);
  border-radius: 8px;
  background: rgba(30, 22, 16, 0.65);
  color: rgba(255, 245, 230, 0.95);
  cursor: pointer;
  font-size: 14px;
}

.back-btn:hover {
  border-color: var(--ui-chrome-border);
  background: rgba(45, 35, 26, 0.85);
}

.back-btn__icon {
  display: block;
  flex-shrink: 0;
}

.game-area {
  flex: 1 1 0;
  display: flex;
  flex-direction: column;
  min-height: 0;
  width: 100%;
}

.tribute-hint {
  position: relative;
  z-index: 50;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 15px;
  text-align: center;
  color: #ccc;
  font-size: 14px;
}

.tribute-hint p {
  margin: 0;
  max-width: 520px;
  line-height: 1.5;
}

.tribute-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.game-controls {
  position: relative;
  z-index: 50;
  display: flex;
  justify-content: center;
  gap: 20px;
  padding: 15px;
}

.control-btn {
  padding: 12px 40px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.control-btn.play {
  position: relative;
  overflow: hidden;
  background-image: var(--ui-theme-btn-gloss), linear-gradient(180deg, #fac542 0%, var(--ui-accent-gold-deep) 52%, #c97106 100%);
  background-size: cover, 100% 100%;
  background-position: center, center;
  background-repeat: no-repeat, no-repeat;
  color: #1a1208;
  font-weight: 700;
  border: 1px solid rgba(255, 220, 140, 0.45);
  box-shadow: 0 4px 14px rgba(232, 148, 12, 0.45);
}

.control-btn.play:hover:not(:disabled) {
  filter: brightness(1.05);
}

.control-btn.play:disabled {
  background-image: none;
  background-color: rgba(120, 90, 40, 0.45);
  border-color: rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.45);
  box-shadow: none;
  cursor: not-allowed;
}

.control-btn.pass {
  background: rgba(38, 28, 20, 0.75);
  color: rgba(255, 248, 238, 0.92);
  border: 1px solid var(--ui-chrome-border-soft);
}

.control-btn.pass:hover:not(:disabled) {
  background: rgba(52, 40, 30, 0.92);
  border-color: var(--ui-chrome-border);
}

.control-btn.pass:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.control-btn.auto-play {
  padding: 9px 26px;
  font-size: 14px;
  background: rgba(48, 36, 26, 0.88);
  color: rgba(255, 245, 230, 0.9);
  border: 1px solid var(--ui-chrome-border-soft);
}

.control-btn.auto-play:hover {
  background: rgba(58, 44, 32, 0.95);
  border-color: var(--ui-chrome-border);
}

.control-btn.tribute {
  background-image: var(--ui-theme-btn-gloss), linear-gradient(180deg, var(--ui-accent-gold) 0%, var(--ui-accent-gold-deep) 100%);
  background-size: cover, 100% 100%;
  background-position: center, center;
  background-repeat: no-repeat, no-repeat;
  color: #1a1208;
  font-weight: 700;
  border: 1px solid rgba(255, 210, 120, 0.4);
  box-shadow: 0 3px 12px rgba(232, 148, 12, 0.38);
}

.control-btn.tribute:disabled {
  background-image: none;
  background-color: rgba(120, 90, 40, 0.4);
  border-color: rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.45);
  box-shadow: none;
  cursor: not-allowed;
}

/* 手牌 / 教练切换：在手牌区域右侧，上下两个按钮（见 GameBoard bottom-actions） */
.coach-switch-row {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-end;
  flex-shrink: 0;
  gap: 0;
  min-width: 88px;
}

.coach-switch-btn {
  padding: 8px 14px;
  font-size: 14px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: rgba(0, 0, 0, 0.28);
  color: rgba(255, 255, 255, 0.72);
  cursor: pointer;
  text-align: center;
}

.coach-switch-btn:first-of-type {
  border-radius: 8px 8px 0 0;
  border-bottom: none;
}

.coach-switch-btn:last-of-type {
  border-radius: 0 0 8px 8px;
}

.coach-switch-btn.active {
  background: rgba(232, 148, 12, 0.35);
  color: #fff;
  border-color: var(--ui-accent-gold);
}

.coach-switch-btn:focus-visible {
  outline: 2px solid var(--ui-accent-gold);
  outline-offset: 2px;
}

/* 教练：Teleport 底栏悬浮层，不挤压主布局 */
.coach-float-layer {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
}

.coach-float-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
}

.coach-float-sheet {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 920px;
  max-height: min(78vh, 640px);
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: linear-gradient(180deg, #3a2e22 0%, #261c14 100%);
  border: 1px solid var(--ui-chrome-border-soft);
  border-radius: 16px 16px 0 0;
  box-shadow: 0 -12px 40px rgba(0, 0, 0, 0.5);
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.coach-float-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  padding: 12px 16px 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.coach-float-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
}

.coach-float-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.coach-float-accept {
  padding: 6px 14px;
  font-size: 13px;
  border: 1px solid rgba(255, 210, 120, 0.35);
  border-radius: 8px;
  background: linear-gradient(180deg, var(--ui-accent-gold) 0%, var(--ui-accent-gold-deep) 100%);
  color: #1a1208;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(232, 148, 12, 0.35);
}

.coach-float-accept:hover:not(:disabled) {
  filter: brightness(1.06);
}

.coach-float-accept:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.coach-float-back {
  padding: 6px 14px;
  font-size: 13px;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.14);
  color: #fff;
  cursor: pointer;
}

.coach-float-back:hover {
  background: rgba(255, 255, 255, 0.22);
}

.coach-float-enter-active,
.coach-float-leave-active {
  transition: opacity 0.2s ease;
}

.coach-float-enter-from,
.coach-float-leave-to {
  opacity: 0;
}

.coach-float-enter-active .coach-float-sheet,
.coach-float-leave-active .coach-float-sheet {
  transition: transform 0.22s ease;
}

.coach-float-enter-from .coach-float-sheet,
.coach-float-leave-to .coach-float-sheet {
  transform: translateY(12px);
}
</style>
