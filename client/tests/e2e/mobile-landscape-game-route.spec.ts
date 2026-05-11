/**
 * Playwright：手机横屏对局壳层 data-testid 与音频控件落在壳层顶栏。
 *
 * 前提：本地 mode=local 需后端 Socket（与 immersive-game-shell 一致）。
 */

import { test, expect } from '@playwright/test'

const iphoneUa =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'

function baseUrl(): string {
  return process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173'
}

test.describe('mobile landscape game shell', () => {
  test('iphone landscape shows mobile shell; audio toggles inside shell top overlay', async ({ browser }) => {
    const context = await browser.newContext({
      userAgent: iphoneUa,
      viewport: { width: 844, height: 390 },
      baseURL: baseUrl(),
    })
    const page = await context.newPage()

    try {
      await page.goto('/game?mode=local&difficulty=normal&name=e2e-ml', {
        waitUntil: 'networkidle',
        timeout: 90_000,
      })

      const mlShell = page.getByTestId('mobile-landscape-game-shell')
      await expect(mlShell).toBeVisible({ timeout: 90_000 })

      const metrics = await page.evaluate(() => {
        const shell = document.querySelector('[data-testid="mobile-landscape-game-shell"]')
        const voice = document.querySelector('[data-testid="audio-voice-toggle"]')
        const bgm = document.querySelector('[data-testid="audio-bgm-toggle"]')
        const sh = shell?.getBoundingClientRect()
        const vr = voice?.getBoundingClientRect()
        const br = bgm?.getBoundingClientRect()
        const pad = 12
        const inShell = (r: DOMRect | undefined) =>
          !!r &&
          !!sh &&
          r.left >= sh.left - pad &&
          r.right <= sh.right + pad &&
          r.top >= sh.top - pad &&
          r.bottom <= sh.bottom + pad
        return {
          voiceInShell: inShell(vr),
          bgmInShell: inShell(br),
        }
      })

      expect(metrics.voiceInShell).toBe(true)
      expect(metrics.bgmInShell).toBe(true)
    } finally {
      await context.close()
    }
  })
})
