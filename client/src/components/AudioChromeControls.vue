<template>
  <div
    class="audio-chrome"
    :class="variant === 'floating' ? 'audio-chrome--floating' : 'audio-chrome--embedded'"
    data-testid="audio-chrome-controls"
  >
    <button
      type="button"
      class="voice-toggle"
      data-testid="audio-voice-toggle"
      :title="voiceMuted ? '开启出牌甜美女声播报' : '关闭出牌甜美女声播报'"
      :aria-pressed="!voiceMuted"
      @click="toggleVoice"
    >
      <span class="voice-toggle__glyph" aria-hidden="true">{{ voiceMuted ? '静' : '播' }}</span>
    </button>
    <button
      type="button"
      class="bgm-toggle"
      data-testid="audio-bgm-toggle"
      :title="bgmMuted ? '开启背景音乐' : '关闭背景音乐'"
      :aria-pressed="!bgmMuted"
      @click="toggleBgm"
    >
      <img
        class="bgm-toggle__icon"
        :src="bgmMuted ? ui.iconVolumeOff : ui.iconVolumeOn"
        alt=""
        width="22"
        height="22"
        draggable="false"
      />
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useBGM } from '@/composables/useBGM'
import { ui } from '@/assets/ui/urls'
import { isPlayVoiceMuted, setPlayVoiceMuted } from '@/audio/play-announce'

withDefaults(
  defineProps<{
    /** floating：全局右上角固定；embedded：顶栏内联 */
    variant?: 'floating' | 'embedded'
  }>(),
  { variant: 'embedded' },
)

const { bgmMuted, toggleBgm } = useBGM()

const voiceMuted = ref(isPlayVoiceMuted())

function toggleVoice() {
  voiceMuted.value = !voiceMuted.value
  setPlayVoiceMuted(voiceMuted.value)
}
</script>

<style scoped>
.audio-chrome--embedded {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.audio-chrome--embedded .voice-toggle,
.audio-chrome--embedded .bgm-toggle {
  position: relative;
  top: auto;
  right: auto;
  z-index: 1;
}

.voice-toggle {
  width: 40px;
  height: 40px;
  padding: 0;
  border: 1px solid var(--ui-chrome-border);
  border-radius: 10px;
  background: rgba(40, 28, 18, 0.72);
  color: inherit;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.voice-toggle:hover {
  background: rgba(55, 38, 22, 0.88);
  border-color: var(--ui-accent-gold);
}

.voice-toggle__glyph {
  pointer-events: none;
  opacity: 0.92;
}

.bgm-toggle {
  width: 40px;
  height: 40px;
  padding: 0;
  border: 1px solid var(--ui-chrome-border);
  border-radius: 10px;
  background: rgba(40, 28, 18, 0.72);
  color: inherit;
  font-size: 18px;
  line-height: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bgm-toggle:hover {
  background: rgba(55, 38, 22, 0.88);
  border-color: var(--ui-accent-gold);
}

.bgm-toggle__icon {
  display: block;
  pointer-events: none;
  flex-shrink: 0;
}

/* 与历史 App 一致：固定于视口右上角，低于竖屏引导层（9990）之上 */
.audio-chrome--floating .voice-toggle {
  position: fixed;
  top: 12px;
  right: 58px;
  z-index: 9999;
}

.audio-chrome--floating .bgm-toggle {
  position: fixed;
  top: 12px;
  right: 12px;
  z-index: 9999;
}
</style>
