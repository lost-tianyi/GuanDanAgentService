<template>
  <button
    type="button"
    class="voice-toggle"
    :title="voiceMuted ? '开启出牌甜美女声播报' : '关闭出牌甜美女声播报'"
    :aria-pressed="!voiceMuted"
    @click="toggleVoice"
  >
    <span class="voice-toggle__glyph" aria-hidden="true">{{ voiceMuted ? '静' : '播' }}</span>
  </button>
  <button
    type="button"
    class="bgm-toggle"
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
  <router-view />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useBGM } from '@/composables/useBGM'
import { ui } from '@/assets/ui/urls'
import { isPlayVoiceMuted, setPlayVoiceMuted, warmupSpeechVoices } from '@/audio/play-announce'
import { resumeAudioForSfx } from '@/audio/play-sfx'

const { bgmMuted, toggleBgm, unlockOnFirstInteraction } = useBGM()

const voiceMuted = ref(isPlayVoiceMuted())

function toggleVoice() {
  voiceMuted.value = !voiceMuted.value
  setPlayVoiceMuted(voiceMuted.value)
}

onMounted(() => {
  unlockOnFirstInteraction()
  const warm = () => {
    warmupSpeechVoices()
    void resumeAudioForSfx()
    document.removeEventListener('click', warm)
    document.removeEventListener('keydown', warm)
    document.removeEventListener('touchstart', warm)
  }
  document.addEventListener('click', warm)
  document.addEventListener('keydown', warm)
  document.addEventListener('touchstart', warm)
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: linear-gradient(145deg, #1e1610 0%, #2a1f14 42%, #141008 100%);
  min-height: 100vh;
  color: #fff;
}

.voice-toggle {
  position: fixed;
  top: 12px;
  right: 58px;
  z-index: 9999;
  width: 40px;
  height: 40px;
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
  position: fixed;
  top: 12px;
  right: 12px;
  z-index: 9999;
  width: 40px;
  height: 40px;
  border: 1px solid var(--ui-chrome-border);
  border-radius: 10px;
  background: rgba(40, 28, 18, 0.72);
  color: inherit;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
}

.bgm-toggle:hover {
  background: rgba(55, 38, 22, 0.88);
  border-color: var(--ui-accent-gold);
}

.bgm-toggle__icon {
  display: block;
  pointer-events: none;
}
</style>
