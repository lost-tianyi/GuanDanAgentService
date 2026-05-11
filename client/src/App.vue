<template>
  <div
    class="layout-scale-viewport"
    :class="{ 'layout-scale-viewport--uniform': stageUniformActive }"
  >
    <div
      id="layout-scale-stage"
      class="layout-scale-stage"
      data-testid="layout-scale-stage"
      :style="stageInlineStyle"
    >
      <AudioChromeControls v-if="floatingAudio" variant="floating" />
      <router-view />
    </div>
  </div>
  <PortraitRotateGate />
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { warmupSpeechVoices } from '@/audio/play-announce'
import { resumeAudioForSfx } from '@/audio/play-sfx'
import { useBGM } from '@/composables/useBGM'
import { useMobileLandscapeUniformScale } from '@/composables/useMobileLandscapeUniformScale'
import PortraitRotateGate from '@/components/PortraitRotateGate.vue'
import AudioChromeControls from '@/components/AudioChromeControls.vue'
import { showFloatingAudioChrome } from '@/utils/route-audio-chrome'

const route = useRoute()
const floatingAudio = computed(() => showFloatingAudioChrome(route.name))

const { stageUniformActive, stageInlineStyle } = useMobileLandscapeUniformScale()

const { unlockOnFirstInteraction } = useBGM()

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
</style>
