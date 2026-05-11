/**
 * `preloadTier1GameAssets` 行为回归（happy-dom + 可控 Image/Audio）。
 *
 * 测试边界（范围内）：
 * - 进度回调 loaded 单调递增、不超过 total；正常完成时 timedOut=false。
 * - 模拟图片永不 onload 时，依赖单图超时仍能推进 loaded（修复「并发槽被挂死 → 全程 0%」）。
 *
 * 不在范围内：
 * - 真实 CDN 带宽、浏览器解码性能。
 *
 * @vitest-environment happy-dom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  preloadTier1GameAssets,
  TIER1_AUDIO_PRELOAD_TIMEOUT_MS,
  TIER1_IMAGE_PRELOAD_TIMEOUT_MS,
} from '@/utils/game-assets-preload'

describe('preloadTier1GameAssets runtime behavior', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'Image',
      class Img {
        onload: (() => void) | null = null
        onerror: (() => void) | null = null
        set src(_s: string) {
          queueMicrotask(() => this.onload?.())
        }
      },
    )
    vi.stubGlobal(
      'Audio',
      class Aud {
        preload = 'auto'
        addEventListener(type: string, fn: () => void, _opts?: unknown) {
          if (type === 'loadeddata' || type === 'canplay' || type === 'canplaythrough') {
            queueMicrotask(fn)
          }
          if (type === 'error') {
            /* skip */
          }
        }
        removeEventListener() {}
        src = ''
        load() {}
      },
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  // 边界：全部资源快速就绪时应跑满进度且在全局超时前结束
  it('loads all tier1 slots with monotonic progress and no timeout', async () => {
    const snapshots: { loaded: number; total: number }[] = []
    const r = await preloadTier1GameAssets((p) => snapshots.push({ loaded: p.loaded, total: p.total }), {
      timeoutMs: 60_000,
    })

    expect(r.timedOut).toBe(false)
    expect(snapshots.length).toBeGreaterThan(0)
    const total = snapshots[0].total
    expect(total).toBeGreaterThan(0)

    let prev = -1
    for (const s of snapshots) {
      expect(s.loaded).toBeGreaterThanOrEqual(prev)
      prev = s.loaded
      expect(s.loaded).toBeLessThanOrEqual(s.total)
      expect(s.total).toBe(total)
    }

    const last = snapshots[snapshots.length - 1]
    expect(last.loaded).toBe(total)
  })

  // 边界：图片既不 onload 也不 onerror 时，单图超时必须 resolve，否则四并发全挂死 → loaded 永久为 0
  it('advances loaded when Image callbacks never fire (image safety timeout)', async () => {
    vi.stubGlobal(
      'Image',
      class Hang {
        onload: (() => void) | null = null
        onerror: (() => void) | null = null
        set src(_s: string) {
          /* hung — reproduces stuck-at-0% without per-image timeout */
        }
      },
    )

    vi.useFakeTimers()

    const loadedSteps: number[] = []
    const done = preloadTier1GameAssets(({ loaded }) => loadedSteps.push(loaded), {
      timeoutMs: 120_000,
      concurrency: 4,
    })

    await vi.advanceTimersByTimeAsync(TIER1_IMAGE_PRELOAD_TIMEOUT_MS)
    await Promise.resolve()

    expect(loadedSteps.some((n) => n >= 1)).toBe(true)

    await vi.advanceTimersByTimeAsync(TIER1_IMAGE_PRELOAD_TIMEOUT_MS)
    await vi.advanceTimersByTimeAsync(TIER1_AUDIO_PRELOAD_TIMEOUT_MS + 200)
    await Promise.resolve()
    await Promise.resolve()

    await done

    expect(Math.max(...loadedSteps)).toBeGreaterThanOrEqual(1)
  })
})
