import type { CardPatternType } from '@/types'

/** 与「播/静」语音开关独立；关闭后仅不出打牌音效 */
const SFX_MUTE_KEY = 'guandan-sfx-muted'

export function isPlaySfxMuted(): boolean {
  if (typeof localStorage === 'undefined') return false
  return localStorage.getItem(SFX_MUTE_KEY) === '1'
}

export function setPlaySfxMuted(muted: boolean): void {
  localStorage.setItem(SFX_MUTE_KEY, muted ? '1' : '0')
}

let ctx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  if (!ctx) ctx = new Ctor()
  return ctx
}

/** 在用户首次点击/按键后调用，解除浏览器对 AudioContext 的暂停限制 */
export async function resumeAudioForSfx(): Promise<void> {
  const c = getCtx()
  if (c?.state === 'suspended') {
    try {
      await c.resume()
    } catch {
      /* ignore */
    }
  }
}

/** 出牌：短促「啪」声；炸弹类略加重低频 */
export function playOutCardSfx(patternType?: CardPatternType): void {
  if (typeof window === 'undefined') return
  if (isPlaySfxMuted()) return

  const audioCtx = getCtx()
  if (!audioCtx) return
  void audioCtx.resume()

  const isHeavy =
    patternType === 'bomb' ||
    patternType === 'straight_bomb' ||
    patternType === 'joker_bomb'

  const t0 = audioCtx.currentTime
  const dur = isHeavy ? 0.14 : 0.09

  const osc = audioCtx.createOscillator()
  const gain = audioCtx.createGain()
  osc.type = isHeavy ? 'square' : 'triangle'

  const f0 = isHeavy ? 165 : 445
  const f1 = isHeavy ? 95 : 195
  osc.frequency.setValueAtTime(f0, t0)
  osc.frequency.exponentialRampToValueAtTime(Math.max(f1, 40), t0 + dur)

  gain.gain.setValueAtTime(0.0001, t0)
  gain.gain.exponentialRampToValueAtTime(isHeavy ? 0.22 : 0.13, t0 + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)

  osc.connect(gain)
  gain.connect(audioCtx.destination)
  osc.start(t0)
  osc.stop(t0 + dur + 0.02)

  // 轻微高频点缀，更像桌面「出牌」
  if (!isHeavy) {
    const osc2 = audioCtx.createOscillator()
    const g2 = audioCtx.createGain()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(1200, t0)
    osc2.frequency.exponentialRampToValueAtTime(600, t0 + 0.05)
    g2.gain.setValueAtTime(0.0001, t0)
    g2.gain.exponentialRampToValueAtTime(0.045, t0 + 0.012)
    g2.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.07)
    osc2.connect(g2)
    g2.connect(audioCtx.destination)
    osc2.start(t0)
    osc2.stop(t0 + 0.08)
  }
}

/** Pass：较轻的「嗖」一下 */
export function playPassSfx(): void {
  if (typeof window === 'undefined') return
  if (isPlaySfxMuted()) return

  const audioCtx = getCtx()
  if (!audioCtx) return
  void audioCtx.resume()

  const t0 = audioCtx.currentTime
  const osc = audioCtx.createOscillator()
  const gain = audioCtx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(380, t0)
  osc.frequency.exponentialRampToValueAtTime(220, t0 + 0.07)

  gain.gain.setValueAtTime(0.0001, t0)
  gain.gain.exponentialRampToValueAtTime(0.06, t0 + 0.015)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.09)

  osc.connect(gain)
  gain.connect(audioCtx.destination)
  osc.start(t0)
  osc.stop(t0 + 0.1)
}
