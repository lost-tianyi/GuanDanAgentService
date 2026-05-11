## 1. Viewport / orientation module

- [x] 1.1 抽象 `isMobileUiCandidate()`、`shouldShowPortraitGate(width, height, ua?)`（或等价命名），导出供 Vue 与测试使用
- [x] 1.2 新增 Vitest 单测文件，覆盖竖屏/横屏与 UA mock，断言遮罩谓词（见 `client-mobile-viewport` 规格）

## 2. Portrait gate UI（欢乐斗地主向）

- [x] 2.1 在根布局（如 `App.vue`）挂载全屏 `PortraitRotateGate`：竖屏 + 手机形态时显示；暖色背景与 token；禁止穿透点击
- [x] 2.2 监听 `resize` / `orientationchange`（及可选 `matchMedia('(orientation: portrait)')`）更新显示状态
- [x] 2.3 （可选）生成或放置一张横屏引导插图至 `client/src/assets/generated/` 或 `ui/`，与 mood 参考风格一致

## 3. 横屏布局与触控

- [x] 3.1 为手机横屏增加顶层 class / CSS 容器，收紧 `HomeView` / `GameView` / `GameBoard` / `HandCards` 的间距与字体缩放（`vmin` / `cqmin` 按需）
- [x] 3.2 主按钮与次要按钮最小触控热区 ≥44×44 CSS px（含 padding）；底部控件增加 `env(safe-area-inset*)`
- [x] 3.3 核对教练浮层、聊天窗在横屏窄高下可滚动且不溢出（目视 + E2E）

## 4. 端到端与其它测试

- [x] 4.1 Playwright：新增或扩展 spec，移动 viewport 竖屏断言遮罩可见，切换横屏断言遮罩消失并可点击关键按钮（`data-testid` 优先）
- [x] 4.2 文档或 `README.zh-CN` 片段：列出合并前须执行 `npm run build`（client）、`npm run test`（server）、E2E 命令（与现有脚本对齐）

## 5. 交付

- [x] 5.1 全流程本地跑通上述测试；修复 flaky
- [x] 5.2 `/opsx-archive` 前按需执行 OpenSpec 规格合并（若团队流程要求）
