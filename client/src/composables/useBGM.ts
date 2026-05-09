import { ref, onMounted } from 'vue'
import { startCheerfulFolkSynthLoop } from '@/audio/cheerful-folk-synth'

const MUTE_KEY = 'guandan-bgm-muted'

/** 模块级单例：避免 Strict Mode / HMR 二次挂载时 new 出多路 BGM 叠放 */
const bgmMuted = ref(typeof localStorage !== 'undefined' && localStorage.getItem(MUTE_KEY) === '1')
const usingFile = ref(false)

/** 当前使用的 HTMLAudio（成功加载 mp3 时）；失败则为 null 走合成器 */
let bgmAudio: HTMLAudioElement | null = null
/** 已执行过一次 new Audio，避免 mp3 失败后 Strict Mode 二次挂载再 new 一路叠加 */
let bgmAudioConstructionStarted = false
let useFallbackSynth = false
let synthStop: (() => void) | null = null
let audioCtx: AudioContext | null = null

function stopSynth() {
  if (synthStop) {
    synthStop()
    synthStop = null
  }
  if (audioCtx) {
    audioCtx.close().catch(() => {})
    audioCtx = null
  }
}

function ensureSynthPlaying() {
  if (synthStop) return
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctx) return
  audioCtx = new Ctx()
  void audioCtx.resume()
  synthStop = startCheerfulFolkSynthLoop(audioCtx, 0.1)
}

function pauseAll() {
  if (bgmAudio) {
    bgmAudio.pause()
  }
  stopSynth()
}

function playCurrent() {
  if (bgmMuted.value) return
  if (bgmAudio && usingFile.value && !useFallbackSynth) {
    stopSynth()
    void bgmAudio.play().catch(() => {})
    return
  }
  if (useFallbackSynth) {
    ensureSynthPlaying()
  }
}

function toggleBgm() {
  bgmMuted.value = !bgmMuted.value
  localStorage.setItem(MUTE_KEY, bgmMuted.value ? '1' : '0')
  if (bgmMuted.value) {
    pauseAll()
  } else {
    playCurrent()
  }
}

function initBgmOnce() {
  /** 已创建过（含 Strict Mode 第二次 mount）：只恢复播放，避免重复 new Audio */
  if (bgmAudio) {
    if (!bgmMuted.value) playCurrent()
    return
  }

  /** mp3 已尝试过且失败：只剩合成器，勿再 new Audio */
  if (bgmAudioConstructionStarted) {
    if (!bgmMuted.value) playCurrent()
    return
  }

  bgmAudioConstructionStarted = true

  const url = (import.meta.env.VITE_BGM_URL as string | undefined)?.trim() || '/audio/bgm.mp3'
  const a = new Audio(url)
  a.loop = true
  a.volume = 0.32
  a.preload = 'auto'

  bgmAudio = a

  a.addEventListener(
    'canplaythrough',
    () => {
      usingFile.value = true
      useFallbackSynth = false
      if (!bgmMuted.value) {
        void a.play().catch(() => {})
      }
    },
    { once: true },
  )

  a.addEventListener('error', () => {
    usingFile.value = false
    useFallbackSynth = true
    try {
      a.pause()
      a.removeAttribute('src')
      a.load()
    } catch {
      /* ignore */
    }
    bgmAudio = null
    if (!bgmMuted.value) {
      ensureSynthPlaying()
    }
  })

  a.load()
}

export function useBGM() {
  onMounted(() => {
    initBgmOnce()
  })

  /** 不在此 pause：Vue Strict Mode 会先卸载再挂载，避免误停导致叠轨或无法再播 */

  function unlockOnFirstInteraction() {
    const go = () => {
      void (async () => {
        if (bgmMuted.value) return
        if (bgmAudio && usingFile.value && !useFallbackSynth) {
          try {
            await bgmAudio.play()
          } catch {
            bgmAudio.play().catch(() => {})
          }
          return
        }
        if (useFallbackSynth) {
          ensureSynthPlaying()
          await audioCtx?.resume()
        }
      })()
      document.removeEventListener('click', go)
      document.removeEventListener('keydown', go)
      document.removeEventListener('touchstart', go)
    }
    document.addEventListener('click', go, { once: true })
    document.addEventListener('keydown', go, { once: true })
    document.addEventListener('touchstart', go, { once: true })
  }

  return {
    bgmMuted,
    usingFile,
    toggleBgm,
    unlockOnFirstInteraction,
  }
}
