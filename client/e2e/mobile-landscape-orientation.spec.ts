import { test, expect } from '@playwright/test'

/** 与 viewport 单测一致的 iPhone UA，用于触发 `isMobileUiCandidate` */
const iphoneUa =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'

function baseUrl(): string {
  return process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173'
}

test.describe('mobile landscape orientation gate', () => {
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

      await expect(page.getByTestId('home-menu-ai')).toBeVisible()
      await page.getByTestId('home-menu-ai').click()
      await expect(page.locator('.difficulty-select')).toBeVisible()
    } finally {
      await context.close()
    }
  })
})
