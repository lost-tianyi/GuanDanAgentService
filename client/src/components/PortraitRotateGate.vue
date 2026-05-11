<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="portrait-rotate-gate"
      role="dialog"
      aria-modal="true"
      aria-labelledby="portrait-rotate-title"
      data-testid="portrait-rotate-gate"
      @touchmove.prevent
    >
      <div class="portrait-rotate-gate__panel">
        <img
          class="portrait-rotate-gate__art"
          :src="ui.portraitRotateHint"
          alt=""
          draggable="false"
        />
        <h1 id="portrait-rotate-title" class="portrait-rotate-gate__title">建议横屏游玩</h1>
        <p class="portrait-rotate-gate__sub">旋转设备至横屏，获得更佳牌桌视野与休闲棋牌体验</p>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ui } from '@/assets/ui/urls'
import { usePortraitGate } from '@/composables/usePortraitGate'

const { visible } = usePortraitGate()
</script>

<style scoped>
.portrait-rotate-gate {
  position: fixed;
  inset: 0;
  z-index: 9990;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: max(16px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right))
    max(16px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left));
  background: linear-gradient(
    165deg,
    var(--ui-board-linear-start) 0%,
    var(--bg-color) 48%,
    var(--ui-board-linear-end) 100%
  );
  box-shadow: inset 0 0 120px rgba(0, 0, 0, 0.35);
}

.portrait-rotate-gate__panel {
  max-width: min(92vw, 420px);
  text-align: center;
}

.portrait-rotate-gate__art {
  display: block;
  width: min(92vw, 360px);
  height: auto;
  margin: 0 auto 18px;
  border-radius: 14px;
  box-shadow:
    0 12px 40px rgba(0, 0, 0, 0.45),
    0 0 0 1px var(--ui-chrome-border-soft);
}

.portrait-rotate-gate__title {
  margin: 0 0 10px;
  font-size: clamp(1.25rem, 4.5vw, 1.5rem);
  font-weight: 800;
  letter-spacing: 0.06em;
  color: var(--ui-accent-title);
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.35);
}

.portrait-rotate-gate__sub {
  margin: 0;
  font-size: clamp(0.85rem, 3.2vw, 0.95rem);
  line-height: 1.55;
  color: rgba(255, 245, 220, 0.82);
}
</style>
