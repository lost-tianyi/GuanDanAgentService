import { test, expect } from '@playwright/test'

/**
 * 对局壳层满宽 + 音频控件位于 game-container 内（需后端 Socket + 前端 dev/preview）
 */
test.describe('immersive game shell', () => {
  test('wide viewport: game-container width ratio; audio toggles inside shell', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/game?mode=local&difficulty=normal&name=e2e', {
      waitUntil: 'networkidle',
      timeout: 60_000,
    })

    const shell = page.locator('.game-container')
    await expect(shell).toBeVisible({ timeout: 60_000 })

    const metrics = await page.evaluate(() => {
      const gc = document.querySelector('.game-container')
      const voice = document.querySelector('[data-testid="audio-voice-toggle"]')
      const bgm = document.querySelector('[data-testid="audio-bgm-toggle"]')
      const vw = window.innerWidth
      const gh = gc?.getBoundingClientRect()
      const vh = voice?.getBoundingClientRect()
      const bh = bgm?.getBoundingClientRect()
      const ratio = gh ? gh.width / vw : 0
      const pad = 14
      const inShell = (r: DOMRect | undefined) =>
        !!r &&
        !!gh &&
        r.left >= gh.left - pad &&
        r.right <= gh.right + pad &&
        r.top >= gh.top - pad &&
        r.bottom <= gh.bottom + pad
      return {
        ratio,
        voiceInShell: inShell(vh),
        bgmInShell: inShell(bh),
      }
    })

    expect(metrics.ratio).toBeGreaterThanOrEqual(0.88)
    expect(metrics.voiceInShell).toBe(true)
    expect(metrics.bgmInShell).toBe(true)
  })
})
