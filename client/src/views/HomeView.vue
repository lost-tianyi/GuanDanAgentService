<template>
  <div class="home" :style="homeThemeVars">
    <div class="logo">
      <h1>惯蛋游戏</h1>
      <p class="subtitle">Guandan Card Game</p>
    </div>

    <div class="menu">
      <div class="menu-card" data-testid="home-menu-ai" @click="startLocalGame">
        <div class="icon">
          <div class="ui-ai-avatar-frame ui-ai-avatar-frame--menu" aria-hidden="true">
            <img :src="ui.avatarAi" alt="" width="64" height="64" draggable="false" />
          </div>
        </div>
        <h3>人机对战</h3>
        <p>与 AI 对手进行游戏</p>
      </div>

      <div class="menu-card" @click="showCreateRoom = true">
        <div class="icon"><img :src="ui.iconMenuHome" alt="" width="64" height="64" draggable="false" /></div>
        <h3>创建房间</h3>
        <p>创建私人房间</p>
      </div>

      <div class="menu-card" @click="showJoinRoom = true">
        <div class="icon"><img :src="ui.iconMenuJoin" alt="" width="64" height="64" draggable="false" /></div>
        <h3>加入房间</h3>
        <p>输入房间号加入</p>
      </div>
    </div>

    <div class="difficulty-select" v-if="startLocal">
      <h3>选择 AI 难度</h3>
      <div class="difficulty-buttons">
        <button @click="startGame('easy')" :class="{ active: difficulty === 'easy' }">
          简单
        </button>
        <button @click="startGame('normal')" :class="{ active: difficulty === 'normal' }">
          普通
        </button>
        <button @click="startGame('hard')" :class="{ active: difficulty === 'hard' }">
          困难
        </button>
      </div>
    </div>

    <div
      v-if="preloadUi.show"
      class="preload-overlay"
      role="status"
      aria-live="polite"
      aria-busy="true"
      data-testid="game-preload-overlay"
    >
      <div class="preload-card">
        <p class="preload-title">加载游戏资源</p>
        <div class="preload-bar" aria-hidden="true">
          <div class="preload-bar__track">
            <div
              class="preload-bar__fill"
              :style="{ width: preloadUi.smoothPercent + '%' }"
            >
              <span class="preload-bar__shine" />
            </div>
          </div>
        </div>
        <p class="preload-meta">
          <span class="preload-meta__pct">{{ displayPercent }}%</span>
          <span class="preload-meta__sep">·</span>
          <span>第 {{ preloadUi.loaded }} / {{ preloadUi.total }} 项</span>
        </p>
        <p class="preload-hint">
          已用时 {{ elapsedSec }}s / 最多 {{ maxSec }}s
          <span v-if="preloadUi.degraded" class="preload-hint__warn">（已超时，继续进入）</span>
        </p>
      </div>
    </div>

    <div class="modal" v-if="showCreateRoom || showJoinRoom" @click.self="closeModals">
      <div class="modal-content" v-if="showCreateRoom">
        <h2>创建房间</h2>
        <input v-model="playerName" placeholder="你的昵称" />
        <div class="modal-buttons">
          <button @click="createRoom">创建</button>
          <button @click="showCreateRoom = false" class="cancel">取消</button>
        </div>
      </div>
      <div class="modal-content" v-if="showJoinRoom">
        <h2>加入房间</h2>
        <input v-model="playerName" placeholder="你的昵称" />
        <input v-model="roomId" placeholder="房间号" />
        <div class="modal-buttons">
          <button @click="joinRoom">加入</button>
          <button @click="showJoinRoom = false" class="cancel">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ui } from '@/assets/ui/urls'
import { preloadTier1GameAssets, TIER1_PRELOAD_TIMEOUT_MS } from '@/utils/game-assets-preload'

const router = useRouter()

const maxSec = TIER1_PRELOAD_TIMEOUT_MS / 1000

const preloadUi = ref({
  show: false,
  loaded: 0,
  total: 0,
  smoothPercent: 0,
  targetPercent: 0,
  degraded: false,
})

const preloadElapsedMs = ref(0)

const displayPercent = computed(() =>
  Math.min(100, Math.max(0, Math.round(preloadUi.value.smoothPercent))),
)

const elapsedSec = computed(() => (preloadElapsedMs.value / 1000).toFixed(1))

let preloadStart = 0
let tickTimer: ReturnType<typeof setInterval> | undefined
let rafSmooth: number | undefined

function stopPreloadTimers() {
  if (tickTimer !== undefined) {
    clearInterval(tickTimer)
    tickTimer = undefined
  }
  if (rafSmooth !== undefined) {
    cancelAnimationFrame(rafSmooth)
    rafSmooth = undefined
  }
}

function tickElapsed() {
  preloadElapsedMs.value = Math.min(
    TIER1_PRELOAD_TIMEOUT_MS,
    Math.round(performance.now() - preloadStart),
  )
}

function runSmoothLoop() {
  const step = () => {
    if (!preloadUi.value.show) return
    const { smoothPercent, targetPercent } = preloadUi.value
    const delta = targetPercent - smoothPercent
    const next =
      Math.abs(delta) < 0.35 ? targetPercent : smoothPercent + delta * 0.22
    preloadUi.value = { ...preloadUi.value, smoothPercent: next }
    rafSmooth = requestAnimationFrame(step)
  }
  rafSmooth = requestAnimationFrame(step)
}

onUnmounted(() => {
  stopPreloadTimers()
})

async function runPreloadThen(go: () => void) {
  stopPreloadTimers()
  preloadStart = performance.now()
  preloadElapsedMs.value = 0
  preloadUi.value = {
    show: true,
    loaded: 0,
    total: 0,
    smoothPercent: 0,
    targetPercent: 0,
    degraded: false,
  }
  runSmoothLoop()

  tickTimer = setInterval(tickElapsed, 100)
  tickElapsed()

  let timedOut = false
  try {
    const r = await preloadTier1GameAssets(
      ({ loaded, total }) => {
        const pct = total > 0 ? (loaded / total) * 100 : 100
        preloadUi.value = {
          ...preloadUi.value,
          loaded,
          total,
          targetPercent: pct,
        }
      },
      { timeoutMs: TIER1_PRELOAD_TIMEOUT_MS },
    )
    timedOut = r.timedOut
  } finally {
    preloadUi.value = {
      ...preloadUi.value,
      degraded: timedOut,
      smoothPercent: 100,
      targetPercent: 100,
    }
    stopPreloadTimers()
    await new Promise((r) => setTimeout(r, timedOut ? 320 : 180))
    preloadUi.value = {
      show: false,
      loaded: 0,
      total: 0,
      smoothPercent: 0,
      targetPercent: 0,
      degraded: false,
    }
  }
  go()
}

const homeThemeVars = computed(() => ({
  '--home-menu-wood': `url(${ui.themePanelHeaderWood})`,
}))

const startLocal = ref(false)
const showCreateRoom = ref(false)
const showJoinRoom = ref(false)
const difficulty = ref<'easy' | 'normal' | 'hard'>('normal')
const playerName = ref('')
const roomId = ref('')

const startLocalGame = () => {
  startLocal.value = true
}

const startGame = async (diff: 'easy' | 'normal' | 'hard') => {
  difficulty.value = diff
  await runPreloadThen(() => {
    router.push({
      name: 'game',
      query: { mode: 'local', difficulty: diff, name: playerName.value || '玩家' },
    })
  })
}

const createRoom = async () => {
  const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase()
  await runPreloadThen(() => {
    router.push({
      name: 'game',
      query: { mode: 'online', room: newRoomId, name: playerName.value || '玩家', action: 'create' },
    })
  })
}

const joinRoom = async () => {
  await runPreloadThen(() => {
    router.push({
      name: 'game',
      query: { mode: 'online', room: roomId.value, name: playerName.value || '玩家', action: 'join' },
    })
  })
}

const closeModals = () => {
  showCreateRoom.value = false
  showJoinRoom.value = false
}
</script>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
}

.logo {
  text-align: center;
  margin-bottom: 40px;
}

.logo h1 {
  font-size: 48px;
  color: var(--ui-accent-title);
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.subtitle {
  color: #888;
  font-size: 14px;
}

.menu {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  justify-content: center;
  margin-bottom: 30px;
}

.menu-card {
  border-radius: 16px;
  padding: 30px;
  width: 200px;
  text-align: center;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  border: 2px solid transparent;
  background-color: var(--card-bg);
  background-image: linear-gradient(165deg, rgba(48, 36, 26, 0.88) 0%, rgba(28, 22, 18, 0.94) 100%), var(--home-menu-wood);
  background-size: cover, 220% auto;
  background-position: center, 50% 30%;
  background-repeat: no-repeat, no-repeat;
}

.menu-card:hover {
  transform: translateY(-5px);
  border-color: var(--ui-accent-gold);
  box-shadow: 0 12px 28px rgba(232, 148, 12, 0.35);
}

.menu-card .icon {
  margin-bottom: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.menu-card .icon .ui-ai-avatar-frame--menu img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.menu-card h3 {
  margin-bottom: 8px;
}

.menu-card p {
  color: #888;
  font-size: 14px;
}

.difficulty-select {
  text-align: center;
}

.difficulty-buttons {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.difficulty-buttons button {
  padding: 10px 25px;
  border: none;
  border-radius: 8px;
  background: var(--card-bg);
  color: #fff;
  cursor: pointer;
  transition: all 0.2s;
}

.difficulty-buttons button.active,
.difficulty-buttons button:hover {
  background: linear-gradient(180deg, var(--ui-accent-gold) 0%, var(--ui-accent-gold-deep) 100%);
  box-shadow: 0 2px 10px rgba(232, 148, 12, 0.4);
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal-content {
  background: var(--card-bg);
  padding: 30px;
  border-radius: 16px;
  width: 350px;
}

.modal-content h2 {
  margin-bottom: 20px;
  text-align: center;
}

.modal-content input {
  width: 100%;
  padding: 12px;
  margin-bottom: 15px;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.modal-buttons {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.modal-buttons button {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  background: linear-gradient(180deg, var(--ui-accent-gold) 0%, var(--ui-accent-gold-deep) 100%);
  color: #fff;
  box-shadow: 0 2px 8px rgba(232, 148, 12, 0.35);
}

.modal-buttons button.cancel {
  background: rgba(45, 35, 26, 0.85);
  border: 1px solid var(--ui-chrome-border-soft);
  box-shadow: none;
  color: rgba(255, 255, 255, 0.88);
}

.preload-overlay {
  position: fixed;
  inset: 0;
  z-index: 400;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(10, 8, 6, 0.82);
  backdrop-filter: blur(6px);
}

.preload-card {
  width: min(360px, 92vw);
  padding: 28px 24px;
  border-radius: 16px;
  border: 1px solid var(--ui-chrome-border-soft);
  background: linear-gradient(165deg, rgba(48, 36, 26, 0.95) 0%, rgba(22, 18, 14, 0.98) 100%);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.45);
}

.preload-title {
  margin: 0 0 18px;
  text-align: center;
  font-size: 17px;
  font-weight: 700;
  color: var(--ui-accent-title);
}

.preload-bar {
  border-radius: 999px;
  overflow: visible;
}

.preload-bar__track {
  position: relative;
  height: 12px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.38);
  overflow: hidden;
  border: 1px solid rgba(255, 200, 120, 0.18);
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.35);
}

.preload-bar__fill {
  position: relative;
  height: 100%;
  min-width: 0;
  border-radius: inherit;
  background: linear-gradient(
    90deg,
    var(--ui-accent-gold-deep) 0%,
    var(--ui-accent-gold) 55%,
    #ffe08a 100%
  );
  box-shadow: 0 0 12px rgba(255, 200, 80, 0.35);
  transition: width 0.08s linear;
}

.preload-bar__shine {
  display: block;
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  background: repeating-linear-gradient(
    -55deg,
    transparent 0,
    transparent 7px,
    rgba(255, 255, 255, 0.14) 7px,
    rgba(255, 255, 255, 0.14) 14px
  );
  animation: preload-bar-shine 0.85s linear infinite;
}

@keyframes preload-bar-shine {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(28px);
  }
}

.preload-meta {
  margin: 14px 0 6px;
  text-align: center;
  font-size: 14px;
  color: rgba(255, 240, 220, 0.88);
  letter-spacing: 0.02em;
}

.preload-meta__pct {
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--ui-accent-title);
}

.preload-meta__sep {
  margin: 0 0.35em;
  opacity: 0.45;
}

.preload-hint {
  margin: 0;
  text-align: center;
  font-size: 13px;
  font-variant-numeric: tabular-nums;
  color: rgba(255, 240, 220, 0.68);
}

.preload-hint__warn {
  display: block;
  margin-top: 8px;
  font-size: 12px;
  color: rgba(255, 200, 120, 0.92);
}
</style>
