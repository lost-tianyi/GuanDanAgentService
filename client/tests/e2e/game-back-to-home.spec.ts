/**
 * 回归：对局页「返回」须回到首页菜单，不得出现 uniform-scale 裁切后的黑屏。
 *
 * 原因简述：#layout-scale-stage 在手机横屏为固定逻辑分辨率 + scale；子树根若用 100vh
 * 会超出舞台，被 .layout-scale-viewport--uniform overflow:hidden 裁掉。
 */

import { test, expect } from '@playwright/test'

const iphoneUa =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'

function baseUrl(): string {
  return process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173'
}

test.describe('game back navigates to home', () => {
  test('desktop: back from local game shows home menu', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/game?mode=local&difficulty=normal&name=e2e-back', {
      waitUntil: 'networkidle',
      timeout: 90_000,
    })

    await expect(
      page.locator('.game-container, [data-testid="mobile-landscape-game-shell"]'),
    ).toBeVisible({ timeout: 90_000 })
    await expect(page.getByRole('button', { name: '返回' })).toBeVisible()

    await Promise.all([
      page.waitForURL((url) => url.pathname === '/', { timeout: 30_000 }),
      page.getByRole('button', { name: '返回' }).click(),
    ])

    await expect(page.getByTestId('home-menu-ai')).toBeVisible({ timeout: 30_000 })
    expect(new URL(page.url()).pathname).toBe('/')
    await expect(page.getByRole('heading', { name: '惯蛋游戏' })).toBeVisible()
  })

  test('iphone landscape: back from local game shows home menu', async ({ browser }) => {
    const context = await browser.newContext({
      userAgent: iphoneUa,
      viewport: { width: 844, height: 390 },
      baseURL: baseUrl(),
    })
    const page = await context.newPage()

    try {
      await page.goto('/game?mode=local&difficulty=normal&name=e2e-back-ml', {
        waitUntil: 'networkidle',
        timeout: 90_000,
      })

      await expect(page.getByTestId('mobile-landscape-game-shell')).toBeVisible({ timeout: 90_000 })
      await expect(page.getByRole('button', { name: '返回' })).toBeVisible()

      await Promise.all([
        page.waitForURL((url) => url.pathname === '/', { timeout: 30_000 }),
        page.getByRole('button', { name: '返回' }).click(),
      ])

      await expect(page.getByTestId('home-menu-ai')).toBeVisible({ timeout: 30_000 })
      expect(new URL(page.url()).pathname).toBe('/')
      await expect(page.getByRole('heading', { name: '惯蛋游戏' })).toBeVisible()

      const menuBox = await page.getByTestId('home-menu-ai').boundingBox()
      expect(menuBox, 'home menu should have non-zero layout box').toBeTruthy()
      expect(menuBox!.width).toBeGreaterThan(40)
      expect(menuBox!.height).toBeGreaterThan(40)
    } finally {
      await context.close()
    }
  })
})
