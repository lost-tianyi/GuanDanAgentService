<template>
  <div class="ml-game-shell" data-testid="mobile-landscape-game-shell">
    <main class="ml-game-shell__felt" aria-label="手机横屏牌桌">
      <div class="ml-game-shell__top">
        <slot name="top" />
      </div>
      <div class="ml-game-shell__board">
        <slot />
      </div>
      <div class="ml-game-shell__player-zone">
        <slot name="player-zone" />
      </div>
    </main>
  </div>
</template>

<style scoped>
/* 必须相对于 #layout-scale-stage（逻辑画布高度），禁止用 100vh：uniform scale 下超出舞台会被 viewport overflow:hidden 裁成「黑屏」 */
.ml-game-shell {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  max-height: 100%;
  min-height: 0;
  box-sizing: border-box;
}

.ml-game-shell__felt {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: inset 0 0 0 1px rgba(255, 200, 120, 0.06);
  background:
    radial-gradient(ellipse 80% 70% at 50% 42%, rgba(80, 52, 28, 0.35) 0%, transparent 55%),
    linear-gradient(145deg, #3d2e20 0%, #2d2218 38%, #1a120c 100%);
}

.ml-game-shell__top {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 6;
  padding-left: max(8px, env(safe-area-inset-left, 0px));
  padding-right: max(8px, env(safe-area-inset-right, 0px));
  padding-top: max(6px, env(safe-area-inset-top, 0px));
  background: linear-gradient(180deg, rgba(26, 18, 12, 0.92) 0%, rgba(26, 18, 12, 0.55) 70%, transparent 100%);
  pointer-events: none;
}

.ml-game-shell__top :deep(*) {
  pointer-events: auto;
}

.ml-game-shell__board {
  flex: 1 1 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 1;
  /* 顶栏叠层：为对家座位与牌桌留竖向余量 */
  padding-top: calc(env(safe-area-inset-top, 0px) + 44px);
  box-sizing: border-box;
}

.ml-game-shell__board :deep(.game-board) {
  border-radius: 0;
  flex: 1 1 0;
  min-height: 0;
}

.ml-game-shell__player-zone {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 5;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 8px max(8px, env(safe-area-inset-bottom, 0px));
  padding-left: max(8px, env(safe-area-inset-left, 0px));
  padding-right: max(8px, env(safe-area-inset-right, 0px));
  background: linear-gradient(
    180deg,
    rgba(45, 34, 24, 0) 0%,
    rgba(35, 26, 18, 0.28) 35%,
    rgba(26, 18, 12, 0.52) 100%
  );
  pointer-events: auto;
}
</style>
