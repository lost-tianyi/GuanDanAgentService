<template>
  <div class="player-info" :class="position">
    <div class="avatar">
      <img
        class="avatar-img"
        :src="player?.isAI ? ui.avatarAi : ui.avatarPlayer"
        alt=""
        width="40"
        height="40"
        draggable="false"
      />
    </div>
    <div class="info">
      <div class="name">{{ player?.name || '等待中' }}</div>
      <div class="cards-count" v-if="player?.cards">
        {{ player.cards.length }} 张
      </div>
      <div class="level" v-if="player?.level">等级: {{ player.level }}</div>
    </div>
    <div class="status">
      <span class="current" v-if="isCurrent">出牌中</span>
      <span class="ready" v-if="player?.isReady">已准备</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Player, PlayerPosition } from '@/types'
import { ui } from '@/assets/ui/urls'

defineProps<{
  player: Player | null
  isCurrent: boolean
  position: PlayerPosition
}>()
</script>

<style scoped>
.player-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.15);
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.info {
  flex: 1;
}

.name {
  font-weight: bold;
  font-size: 14px;
}

.cards-count,
.level {
  font-size: 12px;
  color: #aaa;
}

.status span {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
}

.status .current {
  background: var(--success-color);
  animation: pulse 1s infinite;
}

.status .ready {
  background: var(--warning-color);
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.player-info.left,
.player-info.right {
  writing-mode: vertical-lr;
}

.player-info.left .info,
.player-info.right .info {
  writing-mode: horizontal-tb;
}
</style>
