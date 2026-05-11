/**
 * Playwright E2E：对局壳层布局与音频控件位置。
 *
 * 测试边界（范围内）：
 * - 桌面视口下 `.game-container` 宽度占视口比例、音频 toggle 是否在壳层矩形内。
 *
 * 不在范围内：
 * - 音频静音逻辑、Socket 发牌正确性、移动端安全区。
 *
 * 环境前提：前端 dev/preview 可达；本地对战 mode=local 可不强制后端（路由仍加载）。
 */

import { test, expect } from '@playwright/test'

test.describe('immersive game shell', () => {
  // 边界：大屏宽度 ≥0.88 vw；控件几何落入壳层 bbox±pad（不测像素级 CSS）
  test('wide viewport: game-container width ratio; audio toggles inside shell', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/game?mode=local&difficulty=normal&name=e2e', {
      waitUntil: 'networkidle',
      timeout: 60_000,
    })

    const shell = page.locator('.game-container')
    await expect(shell).toBeVisible({ timeout: 60_000 })
    await expect(page.getByTestId('mobile-landscape-game-shell')).toHaveCount(0)

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
