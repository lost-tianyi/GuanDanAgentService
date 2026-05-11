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
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ui } from '@/assets/ui/urls'

const router = useRouter()

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

const startGame = (diff: 'easy' | 'normal' | 'hard') => {
  difficulty.value = diff
  router.push({ 
    name: 'game', 
    query: { mode: 'local', difficulty: diff, name: playerName.value || '玩家' }
  })
}

const createRoom = () => {
  const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase()
  router.push({
    name: 'game',
    query: { mode: 'online', room: newRoomId, name: playerName.value || '玩家', action: 'create' }
  })
}

const joinRoom = () => {
  router.push({
    name: 'game',
    query: { mode: 'online', room: roomId.value, name: playerName.value || '玩家', action: 'join' }
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
</style>
