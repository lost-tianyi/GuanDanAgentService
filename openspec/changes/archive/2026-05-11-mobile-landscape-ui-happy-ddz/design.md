## Context

- 现有客户端为 Vue 3 + Vite，全局暖色 token（`client-ui-theme`），牌桌以 `GameBoard` + 容器查询布局为主；桌面与宽屏体验优先。
- 移动 Safari / Chrome 横屏后可视高度低、`100vh` 含地址栏抖动；手牌区与底部按钮需避免被刘海/ Home 指示条遮挡。
- 仓库已有 Playwright E2E（`client/e2e`），服务端 Vitest；方向逻辑应尽量抽出便于单元测试。

## Goals / Non-Goals

**Goals:**

- 在手机形态因子下识别 **竖屏**，展示 **欢乐斗地主向** 横屏引导层（文案 + 插画可选），主游戏 UI 不可操作直至 **横屏**（或设计允许的豁免路径）。
- **横屏** 下首页与对局 **单列壳层**：顶栏、牌桌、手牌、聊天/教练入口的可点区域与间距适配 **触控**；与现有主题 token 一致。
- **测试**：纯函数 / composable 单元测试；Playwright 使用 **移动 viewport + 旋转 / resize** 模拟竖横屏关键路径；文档约定合并前跑通 `npm run build`、`npm run test`（server）、`client` E2E（按需启动服务）。

**Non-Goals:**

- 原生 App、PWA 安装提示、横屏锁 API（浏览器无通用强制横屏）。
- 重写完整设计体系；不改变服务端协议。
- 平板大屏单独一套 UI（可按同一套「窄横屏」规则退化，不单独开规格）。

## Decisions

1. **「手机」判定**  
   - **选用**：`navigator.userAgentData.mobile`（若存在）+ `(max-width: …)` / `pointer: coarse` 组合作为降级，封装为 `isMobileUiCandidate()`，便于单测注入 `window`。  
   - **备选**：仅 CSS `@media (orientation: portrait)` —— 无法区分手机与竖屏平板，故不作为唯一条件。

2. **竖屏遮罩**  
   - **选用**：固定定位全屏层，`z-index` 高于根内容；内部禁止 `pointer-events` 穿透；展示旋转图示与「横屏体验更佳」类文案；背景沿用 `--card-bg` / 暖渐变，与欢乐斗地主休闲调性一致。  
   - **备选**：仅用 `screen.orientation.lock` —— 权限与兼容性差，不作为依赖。

3. **横屏布局**  
   - **选用**：在 `orientation: landscape` 且满足手机判定下，对 `#app` 或顶层 wrapper 增加 class（如 `layout--mobile-landscape`），用 CSS 变量收紧 `GameBoard` 网格、`HandCards` 最小触摸高度（≥44px 等价）、底部控制条 `safe-area-inset-bottom`。  
   - **备选**：独立 `MobileGameView.vue` —— 重复逻辑多，除非后续规格膨胀再拆分。

4. **测试分层**  
   - **单元**：方向判定、遮罩显示谓词（给定 `innerWidth/innerHeight` mock）。  
   - **E2E**：Playwright `viewport` 设为 iPhone 尺寸，先竖后横（`page.setViewportSize`），断言遮罩出现/消失与关键按钮可点（`data-testid` 已有则复用）。

## Risks / Trade-offs

- **[Risk]** `vh` / `100dvh` 在各浏览器不一致 → **Mitigation**：壳层高度优先 `100dvh`，fallback `100vh`，并在 design 评审清单中列出 Safari 实测。  
- **[Risk]** E2E 在 CI 无 GPU 时 flaky → **Mitigation**：断言超时放宽、优先稳定选择器、必要时标记 `@slow`。  
- **[Trade-off]** 平板竖屏可能被误判为需横屏 → **Mitigation**：提高 `max-width` 阈值或排除 `min-width` 过大设备；可在 Open Questions 跟进。

## Migration Plan

1. 合并后部署静态资源无迁移；用户仅需刷新。  
2. 若遮罩逻辑误伤桌面窄窗，通过「移动判定」与 `pointer: coarse` 收紧快速修。

## Open Questions

- 是否在竖屏遮罩上提供「仍要竖屏浏览」入口（损害体验，默认不做）。  
- 聊天面板在横屏下的抽屉宽度是否单独限制（可在实现阶段根据截图再调）。
