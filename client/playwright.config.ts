import { defineConfig, devices } from '@playwright/test'

/**
 * 使用前请先在本机终端启动：
 *   终端1: cd server && npm run dev
 *   终端2: cd client && npm run dev
 *
 * 首次运行 E2E：
 *   cd client && npx playwright install chromium
 *   npm run test:e2e
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: undefined,
})
