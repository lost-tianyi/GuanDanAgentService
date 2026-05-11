/**
 * 进入对局前 Tier1 资源预加载（图片 + BGM + 少量高频短语 wav）。
 * 失败单项不阻断；整体受 timeout 约束。
 */

import { ui } from '@/assets/ui/urls'

const phraseWavUrls = import.meta.glob<string>('../assets/audio/*.wav', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

function resolvePhraseWavUrl(key: string): string | undefined {
  const needle = `/audio/${key}.wav`
  const hit = Object.entries(phraseWavUrls).find(([path]) => path.replace(/\\/g, '/').includes(needle))
  return hit?.[1]
}

/** 首局高频短语键（控制数量，避免弱网下时间过长） */
export const TIER1_PHRASE_KEYS = [
  'pass_skip',
  'fallback_play',
  'joker_bomb',
  'triple_with_pair',
  'single_mv_5',
  'pair_mv_5',
  'triple_mv_5',
  'straight_mv_5',
  'bomb_4_mv_5',
] as const

export type PreloadProgress = { loaded: number; total: number }

/** 预加载最长等待；超时后降级进入对局，资源可在局内继续加载 */
export const TIER1_PRELOAD_TIMEOUT_MS = 15_000

const DEFAULT_TIMEOUT_MS = TIER1_PRELOAD_TIMEOUT_MS
const DEFAULT_CONCURRENCY = 4

/** 单张图片最长等待；超时仍 resolve 以释放并发槽位，避免全局进度永远卡在 0 */
export const TIER1_IMAGE_PRELOAD_TIMEOUT_MS = 12_000

/** 单段音频最长等待（弱网 / iOS 可能迟迟无 canplaythrough） */
export const TIER1_AUDIO_PRELOAD_TIMEOUT_MS = 8_000

function preloadImage(url: string): Promise<void> {
  return new Promise((resolve) => {
    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      resolve()
    }
    const img = new Image()
    img.onload = finish
    img.onerror = finish
    img.src = url
    window.setTimeout(finish, TIER1_IMAGE_PRELOAD_TIMEOUT_MS)
  })
}

function preloadAudioUrl(url: string): Promise<void> {
  return new Promise((resolve) => {
    let settled = false
    const done = () => {
      if (settled) return
      settled = true
      resolve()
    }
    const a = new Audio()
    a.preload = 'auto'
    const once = { once: true } as const
    // canplay / loadeddata 早于 canplaythrough，避免移动端长时间卡在 0%（进度条按「完成项数」更新）
    a.addEventListener('canplaythrough', done, once)
    a.addEventListener('canplay', done, once)
    a.addEventListener('loadeddata', done, once)
    a.addEventListener('error', done, once)
    a.src = url
    try {
      a.load()
    } catch {
      done()
    }
    window.setTimeout(done, TIER1_AUDIO_PRELOAD_TIMEOUT_MS)
  })
}

function bgmUrl(): string {
  const u = (import.meta.env.VITE_BGM_URL as string | undefined)?.trim()
  return u || '/audio/bgm.mp3'
}

function tier1ImageUrls(): string[] {
  return [
    ui.gameFeltPhoto,
    ui.themePanelHeaderWood,
    ui.themeBtnPrimaryGloss,
    ui.themePanelPlayerPlate,
    ui.avatarAi,
    ui.iconBack,
  ]
}

async function runLimited<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>,
  onEachDone: () => void,
): Promise<void> {
  let idx = 0
  const runners = Array.from({ length: Math.min(concurrency, Math.max(items.length, 1)) }, async () => {
    while (idx < items.length) {
      const i = idx++
      const item = items[i]
      await worker(item)
      onEachDone()
    }
  })
  await Promise.all(runners)
}

function raceTimeout<T>(p: Promise<T>, ms: number): Promise<T | 'timeout'> {
  return new Promise((resolve) => {
    const t = window.setTimeout(() => resolve('timeout'), ms)
    p.then(
      (v) => {
        window.clearTimeout(t)
        resolve(v)
      },
      () => {
        window.clearTimeout(t)
        resolve('timeout')
      },
    )
  })
}

/**
 * 预加载 Tier1 资源；超时则终止等待并返回（已进入游戏的页面仍可懒加载）。
 * @returns timedOut 为 true 表示在 timeoutMs 内未全部完成，已降级。
 */
export async function preloadTier1GameAssets(
  onProgress: (p: PreloadProgress) => void,
  options?: { timeoutMs?: number; concurrency?: number },
): Promise<{ timedOut: boolean }> {
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const concurrency = options?.concurrency ?? DEFAULT_CONCURRENCY

  const tasks: Array<() => Promise<void>> = []

  for (const url of tier1ImageUrls()) {
    tasks.push(() => preloadImage(url))
  }

  tasks.push(() => preloadAudioUrl(bgmUrl()))

  for (const key of TIER1_PHRASE_KEYS) {
    const url = resolvePhraseWavUrl(key)
    if (url) tasks.push(() => preloadAudioUrl(url))
  }

  const total = tasks.length
  if (total === 0) {
    onProgress({ loaded: 0, total: 0 })
    return { timedOut: false }
  }

  let loaded = 0
  onProgress({ loaded: 0, total })

  const work = async () => {
    await runLimited(
      tasks,
      concurrency,
      async (fn) => {
        await fn()
      },
      () => {
        loaded += 1
        onProgress({ loaded, total })
      },
    )
  }

  const result = await raceTimeout(work(), timeoutMs)
  const timedOut = result === 'timeout'
  if (timedOut) {
    onProgress({ loaded: total, total })
  }
  return { timedOut }
}
