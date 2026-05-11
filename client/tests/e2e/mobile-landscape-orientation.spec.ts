/**
 * Playwright E2E：竖屏旋转门（Portrait gate）显隐与首页可点。
 *
 * 测试边界（范围内）：
 * - 固定 iPhone UA + 竖屏视口 → `portrait-rotate-gate` 可见。
 * - 横屏后 gate 隐藏；主舞台 `layout-scale-stage` 应用 CSS transform 做手机横屏等比缩放。
 * - `home-menu-ai` 可点开难度选择。
 *
 * 不在范围内：
 * - 真机 Orientation API、全屏、刘海遮挡。
 *
 * 环境：Vite 首页 `/` 可访问（无需后端）。
 */

import { test, expect } from '@playwright/test'

/** 与 `tests/unit/utils/viewport.test.ts` 一致，用于触发移动 UI */
const iphoneUa =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'

function baseUrl(): string {
  return process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173'
}

test.describe('mobile landscape orientation gate', () => {
  // 边界：仅验 gate 与菜单交互；不测进入对局后牌桌
  test('portrait shows rotate gate; landscape hides gate and home is tappable', async ({ browser }) => {
    const context = await browser.newContext({
      userAgent: iphoneUa,
      viewport: { width: 390, height: 844 },
      baseURL: baseUrl(),
    })
    const page = await context.newPage()

    try {
      await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30_000 })

      await expect(page.getByTestId('portrait-rotate-gate')).toBeVisible({ timeout: 15_000 })

      await page.setViewportSize({ width: 844, height: 390 })
      await expect(page.getByTestId('portrait-rotate-gate')).toBeHidden()

      const stageTransform = await page.getByTestId('layout-scale-stage').evaluate((el) => {
        return getComputedStyle(el).transform
      })
      expect(stageTransform, 'mobile landscape should scale the logical canvas').not.toBe('none')

      await expect(page.getByTestId('home-menu-ai')).toBeVisible()
      await page.getByTestId('home-menu-ai').click()
      await expect(page.locator('.difficulty-select')).toBeVisible()
    } finally {
      await context.close()
    }
  })
})
