# Client 测试目录

| 路径 | 类型 | 说明 |
|------|------|------|
| `unit/` | Vitest（Node） | 与源码通过 `@/` 别名引用 `src/`，每个文件头注释写明测试边界。 |
| `e2e/` | Playwright | 浏览器端到端；配置见仓库根 `client/playwright.config.ts`。 |

运行：`cd client && npm run test`（单元）、`npm run test:e2e`（E2E）。

预加载回归：`tests/unit/utils/game-assets-preload.preload.test.ts`（`happy-dom`，模拟 Image/Audio）。

横屏等比缩放：`tests/unit/utils/layout-scale.test.ts`（`computeUniformScale`）；`viewport.test.ts` 含 `isMobileLandscapeViewport`。

手牌单行缩放：`tests/unit/utils/hand-cards-layout.test.ts`（`computeHandCardLayout`、`handCardsOuterWidthUnit`）。
