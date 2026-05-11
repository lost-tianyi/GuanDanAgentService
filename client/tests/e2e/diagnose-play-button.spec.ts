/**
 * Playwright E2E：出牌按钮命中诊断（调试向，弱断言）。
 *
 * 测试边界（范围内）：
 * - 进入本地对局后 `btn-play-cards` 可见；elementFromPoint 拾取链非空。
 *
 * 不在范围内：
 * - 出牌是否符合规则、AI 响应、动画完成态。
 *
 * 环境前提：前端 + 后端 Socket（默认 3001）建议已启动；networkidle 依赖资源加载。
 */

import { test, expect } from '@playwright/test'

test.describe('出牌按钮诊断', () => {
  // 边界：几何命中与 disabled 状态日志；不断言「一定可点击出牌」（依赖手牌状态）
  test('elementFromPoint 与 disabled 状态', async ({ page }) => {
    await page.goto('/game?mode=local&difficulty=normal&name=e2e', {
      waitUntil: 'networkidle',
      timeout: 60_000,
    })

    const playBtn = page.getByTestId('btn-play-cards')
    await expect(playBtn).toBeVisible({ timeout: 60_000 })

    const box = await playBtn.boundingBox()
    expect(box).toBeTruthy()

    const cx = box!.x + box!.width / 2
    const cy = box!.y + box!.height / 2

    const hit = await page.evaluate(({ cx, cy }) => {
      const el = document.elementFromPoint(cx, cy) as HTMLElement | null
      if (!el) return null
      const chain: string[] = []
      let cur: HTMLElement | null = el
      for (let i = 0; i < 8 && cur; i++) {
        const cls = cur.className?.toString?.() ?? ''
        const id = cur.id || ''
        const tag = cur.tagName
        const pe = window.getComputedStyle(cur).pointerEvents
        const zi = window.getComputedStyle(cur).zIndex
        chain.push(`${tag}${id ? '#' + id : ''}${cls ? '.' + cls.split(/\s+/).slice(0, 3).join('.') : ''} z:${zi} pe:${pe}`)
        cur = cur.parentElement
      }
      return { tagName: el.tagName, outerSnippet: el.outerHTML.slice(0, 160), chain }
    }, { cx, cy })

    console.log('[e2e] elementFromPoint at 出牌 center:', JSON.stringify(hit, null, 2))

    const disabled = await playBtn.isDisabled()
    console.log('[e2e] 出牌 button disabled:', disabled)

    if (disabled) {
      const firstWrapper = page.locator('.hand-cards .card-wrapper').first()
      await firstWrapper.click({ timeout: 10_000, force: true })
      await page.waitForTimeout(300)
    }

    const disabledAfter = await playBtn.isDisabled()
    console.log('[e2e] 出牌 disabled after optional card click:', disabledAfter)

    const hit2 = await page.evaluate(({ cx, cy }) => {
      const el = document.elementFromPoint(cx, cy)
      return el ? { tagName: el.tagName, className: (el as HTMLElement).className } : null
    }, { cx, cy })
    console.log('[e2e] elementFromPoint after selection:', hit2)

    expect(hit?.chain?.length).toBeGreaterThan(0)
  })
})
