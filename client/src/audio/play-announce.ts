import type { GameState } from '@/types'
import { phraseForCardPattern, phraseForPass } from '@/audio/phrase-registry'

const VOICE_MUTE_KEY = 'guandan-voice-muted'

/** Vite：打包时纳入 assets/audio 下已有 wav（可按脚本批量生成） */
const phraseWavUrls = import.meta.glob<string>('../assets/audio/*.wav', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

/** 女声线索（资源缺失时 TTS 回退使用） */
const FEMALE_HINTS = [
  'xiaoxiao',
  'xiao xiao',
  'xiaoyi',
  'yaoyao',
  'yao yao',
  'meijia',
  'mei-jia',
  'mei jia',
  'ting ting',
  'tingting',
  'sinji',
  'sin-ji',
  'huihui',
  'hui hui',
  'female',
  'girl',
  'woman',
  '女',
]

const MALE_HINTS = ['kangkang', 'yunxia', 'yun yang', 'yunyang', 'male', '男', 'bo_yang', 'boyang']

export function isPlayVoiceMuted(): boolean {
  if (typeof localStorage === 'undefined') return false
  return localStorage.getItem(VOICE_MUTE_KEY) === '1'
}

export function setPlayVoiceMuted(muted: boolean): void {
  localStorage.setItem(VOICE_MUTE_KEY, muted ? '1' : '0')
}

function resolvePhraseUrl(key: string): string | undefined {
  const needle = `/audio/${key}.wav`
  const hit = Object.entries(phraseWavUrls).find(([path]) => path.replace(/\\/g, '/').includes(needle))
  return hit?.[1]
}

let cachedSweetFemaleVoice: SpeechSynthesisVoice | undefined
let voicesHooked = false
let playingAudio: HTMLAudioElement | null = null

function zhVoicesList(): SpeechSynthesisVoice[] {
  const synth = window.speechSynthesis
  const all = synth.getVoices()
  const L = (s: string) => s.toLowerCase()
  const strict = all.filter((v) => {
    const lang = L(v.lang)
    return (
      lang === 'zh-cn' ||
      lang.startsWith('zh-cn') ||
      lang === 'zh-hans' ||
      lang.startsWith('zh-hans')
    )
  })
  if (strict.length) return strict
  const anyZh = all.filter((v) => L(v.lang).startsWith('zh'))
  return anyZh.length ? anyZh : all
}

function femaleVoiceScore(v: SpeechSynthesisVoice): number {
  const blob = `${v.name}\u0000${v.voiceURI}`.toLowerCase()
  let score = 0
  for (const h of FEMALE_HINTS) {
    if (blob.includes(h)) score += 12
  }
  for (const h of MALE_HINTS) {
    if (blob.includes(h)) score -= 25
  }
  if (/zh-cn|zh_cn|^cn$/i.test(v.lang)) score += 3
  return score
}

function pickSweetFemaleZhVoice(): SpeechSynthesisVoice | undefined {
  const list = zhVoicesList()
  if (!list.length) return undefined

  let best = list[0]
  let bestScore = femaleVoiceScore(best)
  for (const v of list) {
    const s = femaleVoiceScore(v)
    if (s > bestScore) {
      bestScore = s
      best = v
    }
  }
  return best
}

function refreshVoice(): void {
  cachedSweetFemaleVoice = pickSweetFemaleZhVoice()
}

function ensureVoiceHook(): void {
  if (voicesHooked || typeof window === 'undefined') return
  voicesHooked = true
  refreshVoice()
  window.speechSynthesis.onvoiceschanged = () => {
    refreshVoice()
  }
}

function stopPlayback(): void {
  if (playingAudio) {
    playingAudio.pause()
    playingAudio.currentTime = 0
    playingAudio = null
  }
  window.speechSynthesis?.cancel()
}

/** 资源缺失时使用浏览器甜美女声 TTS */
function speakTtsFallback(text: string): void {
  if (typeof window === 'undefined') return
  if (!window.speechSynthesis) return

  ensureVoiceHook()
  if (!cachedSweetFemaleVoice) refreshVoice()

  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'zh-CN'
  const voice = cachedSweetFemaleVoice
  if (voice) {
    u.voice = voice
    if (voice.lang) u.lang = voice.lang
  }
  u.pitch = 1.12
  u.rate = 0.94
  u.volume = 1
  window.speechSynthesis.speak(u)
}

/** 优先播放本地 wav，失败或未生成则 TTS */
function playAssetOrSpeak(key: string, text: string): void {
  if (typeof window === 'undefined') return
  if (isPlayVoiceMuted()) return

  stopPlayback()

  const url = resolvePhraseUrl(key)
  if (url) {
    const a = new Audio(url)
    playingAudio = a
    a.volume = 1
    a.onended = () => {
      if (playingAudio === a) playingAudio = null
    }
    void a.play().catch(() => {
      playingAudio = null
      speakTtsFallback(text)
    })
    return
  }
  speakTtsFallback(text)
}

/** 首次点击页面时可调用，便于加载系统中文语音列表（部分浏览器） */
export function warmupSpeechVoices(): void {
  ensureVoiceHook()
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.getVoices()
    refreshVoice()
  }
}

export function announceCardsPlayed(state: GameState): void {
  const steps = state.playedCards
  if (!steps?.length) return
  const last = steps[steps.length - 1]
  if (!last?.pattern || !last.cards?.length) return
  const { key, text } = phraseForCardPattern(last.pattern)
  playAssetOrSpeak(key, text)
}

export function announcePlayerPassed(state: GameState): void {
  const steps = state.playedCards
  if (!steps?.length) return
  const last = steps[steps.length - 1]
  if (last.cards.length !== 0) return
  const { key, text } = phraseForPass()
  playAssetOrSpeak(key, text)
}
