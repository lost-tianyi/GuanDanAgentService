## Why

在手机浏览器打开当前 Web 客户端时，布局与触控区域未按横屏握持场景优化，易出现裁切、误触与可读性问题。欢乐斗地主类休闲棋牌在移动端普遍以 **横屏全宽** 为主交互形态；需在竖屏时引导旋转，在横屏下重构壳层与触控逻辑，并通过自动化测试固化行为。

## What Changes

- 使用 **移动设备检测 + 视口方向（竖屏）** 时展示全屏 **「建议横屏游玩」** 遮罩（欢乐斗地主向文案与视觉层级），阻止主界面交互直至横屏或用户明确关闭策略按设计文档。
- **横屏（含旋转后）** 下：首页与对局页的 **布局、安全区、触控目标、手牌区与底部控件** 适配窄高视口；必要时采用 **容器查询 / `vmin`** / 专用移动端样式作用域，与现有暖色主题 token 兼容。
- **测试**：为方向检测与遮罩逻辑补充 **可单元测试的纯函数**；使用现有 **Playwright** 管线增加 **移动端横竖屏 / viewport** 场景或专用 spec；服务端 Vitest 若有共享逻辑则一并覆盖；CI 或文档约定 **`npm run test` + `client` E2E** 作为交付门槛。

## Capabilities

### New Capabilities

- `client-mobile-viewport`: 移动端竖屏引导、横屏壳层与触控适配的可验收需求；含测试与可追溯场景。

### Modified Capabilities

- `client-ui-theme`: 增补「移动端横屏呈现」与主题 token 一致性要求（不改变既有桌面验收，仅扩展移动端场景）。

## Impact

- **前端**：`App.vue` / 根布局、`HomeView`、`GameView`、`GameBoard`、`HandCards`、全局样式；可能新增 composable（如 `useViewportOrientation`）、小型组件（横屏提示层）。
- **测试**：`client` 下 Vitest（若引入）、`e2e` Playwright 配置与用例；可选 CI 文档更新。
- **资源**：遮罩可用 CSS + 现有 token；若需装饰图可沿用欢乐斗地主向生成素材路径（与 `client-ui-theme` mood 参考一致），不阻塞需求验收。
- **后端**：无行为变更（除非后续单独变更）。
