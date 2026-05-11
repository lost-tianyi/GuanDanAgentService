<template>
  <div
    ref="handRootRef"
    class="hand-cards"
    :class="{ 'brush-selecting': brushSelecting }"
    :style="handLayoutStyle"
  >
    <div
      v-for="(group, gi) in cardGroups"
      :key="'rank-' + group[0].rank + '-' + gi"
      class="rank-stack"
    >
      <div class="rank-stack__pile">
        <div
          v-for="(card, ci) in visibleCardsForStack(group, gi)"
          :key="card.id"
          class="card-wrapper"
          :data-card-id="card.id"
          :class="{
            selected: isSelected(card),
            selectable: selectable,
          }"
          :style="{ zIndex: ci + 1 }"
          @pointerdown="onCardPointerDown($event, card)"
        >
          <div class="card" :class="getCardClass(card)">
            <div v-if="card.rank === 'SJ' || card.rank === 'BJ'" class="joker-face">
              <JokerCardArt :variant="jokerVariant(card)" />
            </div>
            <div class="card-top">
              <span>{{ getRankDisplay(card.rank) }}</span>
              <img v-if="suitImg(card)" class="suit-img suit-img--corner" :src="suitImg(card)!" alt="" draggable="false" />
              <span v-else class="suit">{{ getSuitIcon(card) }}</span>
            </div>
            <div class="card-center">
              <img
                v-if="card.rank !== 'SJ' && card.rank !== 'BJ' && suitImg(card)"
                class="suit-img suit-img--center"
                :src="suitImg(card)!"
                alt=""
                draggable="false"
              />
            </div>
            <div class="card-bottom">
              <span>{{ getRankDisplay(card.rank) }}</span>
              <img v-if="suitImg(card)" class="suit-img suit-img--corner" :src="suitImg(card)!" alt="" draggable="false" />
              <span v-else class="suit">{{ getSuitIcon(card) }}</span>
            </div>
          </div>
        </div>
      </div>
      <button
        v-if="showRankStackExpandControl(group)"
        type="button"
        class="rank-stack-expand-chip"
        :aria-expanded="isRankStackExpanded(gi)"
        :aria-label="rankStackExpandAriaLabel(group, gi)"
        @click="toggleRankStackExpand(gi, $event)"
      >
        {{ rankStackExpandLabel(group, gi) }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import type { Card, CardRank } from '@/types'
import { resumeAudioForSfx } from '@/audio/play-sfx'
import { suitImageUrl } from '@/assets/ui/urls'
import { gameConfig } from '@game-config'
import JokerCardArt from '@/components/Game/JokerCardArt.vue'
import { playStrength } from '@/utils/guandan-order'
import {
  collapsedRankStackOverflowCount,
  computeHandCardLayout,
  effectiveMaxStackDepthForLayout,
  HAND_CARD_MIN_RATIO,
  handCardsAllocatedHeightPx,
  handCardsAllocatedWidthPx,
  MOBILE_RANK_STACK_COLLAPSED_VISIBLE,
  visibleCardsForRankStack,
} from '@/utils/hand-cards-layout'

const props = withDefaults(
  defineProps<{
    cards: Card[]
    selectedCards: Card[]
    selectable: boolean
    /** 当前级牌点数，用于掼蛋牌力排序 */
    levelRank: CardRank
  }>(),
  { levelRank: '2' },
)

const emit = defineEmits<{
  (e: 'select', card: Card): void
  (e: 'add-to-selection', card: Card): void
}>()

const brushSelecting = ref(false)
const handRootRef = ref<HTMLElement | null>(null)
const handOuterWidthPx = ref(0)
const handOuterHeightPx = ref(0)
/** 与 `html.layout--mobile-landscape` 同步，用于手牌缩放下限（避免相对按钮过小） */
const mobileLandscapeCompactUi = ref(false)
/** 横屏同点叠牌展开：列索引 → 展开全部张 */
const expandedRankStacks = ref<Record<number, boolean>>({})

let resizeObserver: ResizeObserver | null = null

function measureHandLayout() {
  const el = handRootRef.value
  if (!el) return
  const prevCompact = mobileLandscapeCompactUi.value
  handOuterWidthPx.value = handCardsAllocatedWidthPx(el)
  handOuterHeightPx.value = handCardsAllocatedHeightPx(el)
  if (typeof document !== 'undefined') {
    mobileLandscapeCompactUi.value = document.documentElement.classList.contains(
      'layout--mobile-landscape',
    )
  }
  if (prevCompact && !mobileLandscapeCompactUi.value) {
    expandedRankStacks.value = {}
  }
}

function isRankStackExpanded(gi: number): boolean {
  return !!expandedRankStacks.value[gi]
}

function visibleCardsForStack(group: Card[], gi: number): Card[] {
  return visibleCardsForRankStack(
    group,
    mobileLandscapeCompactUi.value,
    MOBILE_RANK_STACK_COLLAPSED_VISIBLE,
    isRankStackExpanded(gi),
  )
}

function showRankStackExpandControl(group: Card[]): boolean {
  return (
    mobileLandscapeCompactUi.value && group.length > MOBILE_RANK_STACK_COLLAPSED_VISIBLE
  )
}

function rankStackExpandLabel(group: Card[], gi: number): string {
  if (isRankStackExpanded(gi)) return '收起'
  const n = collapsedRankStackOverflowCount(
    group,
    mobileLandscapeCompactUi.value,
    MOBILE_RANK_STACK_COLLAPSED_VISIBLE,
    false,
  )
  return `+${n}`
}

function rankStackExpandAriaLabel(group: Card[], gi: number): string {
  if (isRankStackExpanded(gi)) return '收起同点叠牌'
  const n = collapsedRankStackOverflowCount(
    group,
    mobileLandscapeCompactUi.value,
    MOBILE_RANK_STACK_COLLAPSED_VISIBLE,
    false,
  )
  return `展开该列其余 ${n} 张同点牌`
}

function toggleRankStackExpand(gi: number, e: MouseEvent) {
  e.preventDefault()
  e.stopPropagation()
  const cur = expandedRankStacks.value
  expandedRankStacks.value = {
    ...cur,
    [gi]: !cur[gi],
  }
  void nextTick(() => measureHandLayout())
}

const LONG_PRESS_MS = gameConfig.client.handLongPressMs
const MOVE_CANCEL_SQ = gameConfig.client.handMoveCancelPx ** 2

const ptr = {
  activeId: null as number | null,
  timer: null as ReturnType<typeof setTimeout> | null,
  downCard: null as Card | null,
  startX: 0,
  startY: 0,
  cancelTap: false,
}

function removeDocListeners() {
  document.removeEventListener('pointermove', onDocPointerMove, true)
  document.removeEventListener('pointerup', onDocPointerUp, true)
  document.removeEventListener('pointercancel', onDocPointerUp, true)
}

function pickCardFromPoint(clientX: number, clientY: number): Card | null {
  const el = document.elementFromPoint(clientX, clientY)
  const wrap = el?.closest?.('[data-card-id]') as HTMLElement | undefined
  const id = wrap?.dataset?.cardId
  if (!id) return null
  return props.cards.find((c) => c.id === id) ?? null
}

function onDocPointerMove(e: PointerEvent) {
  if (ptr.activeId !== e.pointerId) return

  const dx = e.clientX - ptr.startX
  const dy = e.clientY - ptr.startY

  if (!brushSelecting.value && ptr.timer) {
    if (dx * dx + dy * dy > MOVE_CANCEL_SQ) {
      ptr.cancelTap = true
      if (ptr.timer) {
        clearTimeout(ptr.timer)
        ptr.timer = null
      }
    }
  }

  if (brushSelecting.value) {
    const card = pickCardFromPoint(e.clientX, e.clientY)
    if (card) emit('add-to-selection', card)
  }
}

function onDocPointerUp(e: PointerEvent) {
  if (ptr.activeId !== e.pointerId) return

  removeDocListeners()

  if (ptr.timer) {
    clearTimeout(ptr.timer)
    ptr.timer = null
  }

  if (brushSelecting.value) {
    brushSelecting.value = false
    document.body.style.userSelect = ''
    ptr.activeId = null
    ptr.downCard = null
    ptr.cancelTap = false
    return
  }

  if (!ptr.cancelTap && ptr.downCard) {
    emit('select', ptr.downCard)
  }

  ptr.activeId = null
  ptr.downCard = null
  ptr.cancelTap = false
}

function onCardPointerDown(e: PointerEvent, card: Card) {
  if (!props.selectable) return
  if (e.pointerType === 'mouse' && e.button !== 0) return
  if (ptr.activeId !== null) return

  void resumeAudioForSfx()

  e.preventDefault()

  ptr.activeId = e.pointerId
  ptr.downCard = card
  ptr.startX = e.clientX
  ptr.startY = e.clientY
  ptr.cancelTap = false

  ptr.timer = setTimeout(() => {
    ptr.timer = null
    if (!ptr.cancelTap && ptr.downCard) {
      brushSelecting.value = true
      document.body.style.userSelect = 'none'
      emit('add-to-selection', ptr.downCard)
    }
  }, LONG_PRESS_MS)

  document.addEventListener('pointermove', onDocPointerMove, true)
  document.addEventListener('pointerup', onDocPointerUp, true)
  document.addEventListener('pointercancel', onDocPointerUp, true)
}

/** 同点数内花色顺序：红桃 → 方片 → 黑桃 → 梅花 → 王牌 */
const suitOrder = (s: Card['suit']) => {
  const o: Record<string, number> = { hearts: 0, diamonds: 1, spades: 2, clubs: 3, joker: 4 }
  return o[s] ?? 9
}

/**
 * 先按掼蛋牌力从大到小横向分堆；同点数字面（rank）的牌一列，再按花色排序叠牌。
 */
const cardGroups = computed(() => {
  const lr = props.levelRank
  const sorted = [...props.cards].sort((a, b) => {
    const pb = playStrength(b, lr)
    const pa = playStrength(a, lr)
    if (pb !== pa) return pb - pa
    const sd = suitOrder(a.suit) - suitOrder(b.suit)
    if (sd !== 0) return sd
    return a.id.localeCompare(b.id)
  })
  const groups: Card[][] = []
  for (const card of sorted) {
    const last = groups[groups.length - 1]
    if (last && last[0].rank === card.rank) {
      last.push(card)
    } else {
      groups.push([card])
    }
  }
  return groups
})

/** 单列最高叠牌张数（考虑横屏折叠列的有效叠深） */
const layoutMaxStackDepth = computed(() => {
  const groups = cardGroups.value
  return effectiveMaxStackDepthForLayout(
    groups,
    mobileLandscapeCompactUi.value,
    MOBILE_RANK_STACK_COLLAPSED_VISIBLE,
    (gi) => isRankStackExpanded(gi),
  )
})

const layoutMetrics = computed(() =>
  computeHandCardLayout(handOuterWidthPx.value, cardGroups.value.length, {
    maxStackDepth: layoutMaxStackDepth.value,
    maxAreaHeightPx:
      handOuterHeightPx.value > 0 ? handOuterHeightPx.value : undefined,
    minRatio: mobileLandscapeCompactUi.value ? HAND_CARD_MIN_RATIO : undefined,
  }),
)

const handLayoutStyle = computed(() => {
  const m = layoutMetrics.value
  return {
    '--card-w': `${m.cardW}px`,
    '--card-h': `${m.cardH}px`,
    '--stack-overlap': `${m.stackOverlap}px`,
    '--hand-gap': `${m.gap}px`,
    '--lift-hover': `${(m.cardW * 10) / 60}px`,
    '--lift-selected': `${(m.cardW * 20) / 60}px`,
    '--corner-font': `${(m.cardW * 12) / 60}px`,
    '--center-font': `${(m.cardW * 24) / 60}px`,
    '--suit-font': `${(m.cardW * 10) / 60}px`,
    '--suit-img-corner': `${(m.cardW * 11) / 60}px`,
    '--suit-img-center': `${(m.cardW * 26) / 60}px`,
    padding: `${m.padTop}px ${m.padH}px ${m.padBottom}px`,
  }
})

watch(cardGroups, async () => {
  await nextTick()
  measureHandLayout()
})

function onOrientationOrResize() {
  measureHandLayout()
}

onMounted(() => {
  nextTick(() => {
    measureHandLayout()
    resizeObserver = new ResizeObserver(() => measureHandLayout())
    if (handRootRef.value) resizeObserver.observe(handRootRef.value)
    const parent = handRootRef.value?.parentElement
    if (parent) resizeObserver.observe(parent)
    window.addEventListener('orientationchange', onOrientationOrResize)
  })
})

const isSelected = (card: Card) => {
  return props.selectedCards.some((c) => c.id === card.id)
}

function jokerVariant(card: Card): 'SJ' | 'BJ' {
  return card.rank === 'BJ' ? 'BJ' : 'SJ'
}

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
  const map: Record<string, string> = {
    SJ: '小王',
    BJ: '大王',
    '2': '2',
  }
  return map[rank] || rank
}

/** 角上花色：王用「王」字，避免与点数混淆 */
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

onUnmounted(() => {
  window.removeEventListener('orientationchange', onOrientationOrResize)
  resizeObserver?.disconnect()
  resizeObserver = null
  removeDocListeners()
  if (ptr.timer) clearTimeout(ptr.timer)
  document.body.style.userSelect = ''
  brushSelecting.value = false
})

</script>

<style scoped>
/* 同点数一列，列从左到右点数从大到小；列内纵向叠牌 */
.hand-cards {
  --card-w: 60px;
  --card-h: 85px;
  --stack-overlap: 58px;
  --hand-gap: 10px;

  /* 占满 .my-cards 分配宽，避免 flex 子项随缩小后的内容收缩导致测量↔比例负反馈 */
  width: 100%;
  box-sizing: border-box;

  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: center;
  align-items: flex-end;
  gap: var(--hand-gap);
  min-width: 0;
  max-height: 100%;
  overflow-x: auto;
  overflow-y: auto;
  touch-action: manipulation;
}

.hand-cards.brush-selecting {
  cursor: grabbing;
  user-select: none;
}

.rank-stack {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

.rank-stack__pile {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.rank-stack-expand-chip {
  flex-shrink: 0;
  margin-top: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid rgba(250, 204, 21, 0.55);
  background: rgba(22, 16, 12, 0.88);
  color: rgba(253, 224, 71, 0.95);
  font-size: max(11px, calc(var(--card-w, 60px) * 0.22));
  font-weight: 700;
  cursor: pointer;
  touch-action: manipulation;
  line-height: 1.2;
}

.rank-stack-expand-chip:focus-visible {
  outline: 2px solid rgba(253, 224, 71, 0.85);
  outline-offset: 2px;
}

.card-wrapper {
  width: var(--card-w);
  touch-action: none;
}

.rank-stack__pile > .card-wrapper:not(:first-child) {
  margin-top: calc(-1 * var(--stack-overlap));
}

.card-wrapper.selectable {
  cursor: pointer;
}

.hand-cards.brush-selecting .card-wrapper.selectable {
  cursor: grabbing;
}

.card-wrapper.selectable:hover:not(.selected) .card {
  transform: translateY(calc(-1 * var(--lift-hover, 10px)));
}

.card-wrapper.selected .card {
  transform: translateY(calc(-1 * var(--lift-selected, 20px)));
  box-shadow:
    0 6px 22px rgba(251, 191, 36, 0.42),
    0 2px 10px rgba(0, 0, 0, 0.28);
}

.card-wrapper.selected .card::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 6px;
  pointer-events: none;
  z-index: 2;
  background: linear-gradient(
    165deg,
    rgba(253, 224, 71, 0.38) 0%,
    rgba(250, 204, 21, 0.22) 45%,
    rgba(234, 179, 8, 0.28) 100%
  );
  box-shadow: inset 0 0 0 2px rgba(253, 224, 71, 0.95);
}

.card {
  position: relative;
  width: var(--card-w);
  height: var(--card-h);
  background: #fff;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.joker-face {
  position: absolute;
  inset: 0;
  border-radius: 6px;
  overflow: hidden;
  z-index: 0;
}

.card-top,
.card-center,
.card-bottom {
  position: relative;
  z-index: 3;
}

.card.red {
  color: #e74c3c;
}

.card.black {
  color: #2c3e50;
}

.card.joker-small,
.card.joker-big {
  background: transparent;
  color: #fff;
  overflow: hidden;
}

.card.joker-small .card-top,
.card.joker-small .card-bottom,
.card.joker-big .card-top,
.card.joker-big .card-bottom {
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.75);
}

.card-top,
.card-bottom {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: var(--corner-font, 12px);
  font-weight: bold;
  line-height: 1;
}

.card-center {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--center-font, 24px);
}

.suit {
  font-size: var(--suit-font, 10px);
}

.suit-img {
  display: block;
  object-fit: contain;
  flex-shrink: 0;
}

.suit-img--corner {
  width: var(--suit-img-corner, 11px);
  height: var(--suit-img-corner, 11px);
  margin-top: 1px;
}

.suit-img--center {
  width: var(--suit-img-center, 26px);
  height: var(--suit-img-center, 26px);
}
</style>
