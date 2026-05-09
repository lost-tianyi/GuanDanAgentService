import { test, expect } from '@playwright/test'

/**
 * 诊断「出牌」按钮：是否被其它层遮挡、是否处于 disabled、点击是否触发。
 * 依赖后端 Socket（localhost:3001）与前端 Vite（默认 5173）已启动。
 */
test.describe('出牌按钮诊断', () => {
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
      await firstWrapper.click({ timeout: 10_000 })
      await page.waitForTimeout(300)
    }

    const disabledAfter = await playBtn.isDisabled()
    console.log('[e2e] 出牌 disabled after optional card click:', disabledAfter)

    const hit2 = await page.evaluate(({ cx, cy }) => {
      const el = document.elementFromPoint(cx, cy)
      return el ? { tagName: el.tagName, className: (el as HTMLElement).className } : null
    }, { cx, cy })
    console.log('[e2e] elementFromPoint after selection:', hit2)

    // 期望：拾取到的应是按钮本身或其子节点（纯文本按钮一般命中 BUTTON）
    expect(hit?.chain?.length).toBeGreaterThan(0)
  })
})
