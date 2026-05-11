## Why

对局页 `GameView` 当前将主容器限制在 **最大宽度 1200px 且水平居中**，宽屏浏览器两侧出现明显「空白带」。与此同时，**语音播报 / BGM** 开关固定在 `App.vue` 的视口右上角，视觉上落在 **牌桌主画布之外**，削弱沉浸感，也与欢乐斗地主类「整块牌桌铺满可视区域」的体验不一致。

## What Changes

- **布局**：对局路由下主壳层（含 `GameBoard` 牌桌表面）**尽可能贴满可用视口**（宽向满宽、纵向在顶栏/底栏之间最大化牌桌区）；避免仅为桌面宽屏保留对称大边距（可通过极小水平 `padding` + `safe-area` 保留可点边距）。
- **音频控件**：将播报 / BGM 控件纳入 **对局壳层同一视觉层级**（例如顶栏右侧集群或与返回按钮同排的 chrome 内），避免悬浮在「画布外」的空白区域。
- **回归防护**：补充 **Vitest**（若有可单测的布局常量或路由元数据工具）与 **Playwright**（量宽断言 + 关键控件仍在可交互区域内），确保不改坏竖屏遮罩、教练浮层与出牌流程。

## Capabilities

### New Capabilities

- `client-game-shell`：对局页视口铺满与壳层内控件归属的可验收需求。

### Modified Capabilities

- （可选）若归档合并时需 touching `client-ui-theme`：仅补充「沉浸牌桌壳层」与既有暖色 token 一致性的交叉引用，不改变既有桌面主题验收语句。

## Impact

- **前端**：`App.vue`、`views/GameView.vue`、`components/Game/GameBoard.vue` 及相关全局样式；可能新增小组件（顶栏音频控件）或 composable。
- **测试**：`client` Vitest / Playwright；文档中列出合并前命令。
- **后端**：无。
