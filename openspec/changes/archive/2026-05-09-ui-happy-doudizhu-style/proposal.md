## Why

当前客户端为通用深色科技风与本地 SVG/PNG 拼贴，与目标用户熟悉的 **「欢乐斗地主」式** 休闲棋牌 UI（高饱和、暖金点缀、木质感按钮、更圆润的牌桌与控件）存在明显气质差距，难以传达轻松对局感。需要在不改动对局规则的前提下，统一视觉语言与关键界面层级，并沉淀可复用的设计约定与素材位。

## What Changes

- 建立与「欢乐斗地主」参考系对齐的 **设计 token**（色板、圆角、阴影、字号层级、主按钮/次级按钮样式）。
- 重构 **全局与局内界面** 的样式落点：`App` 背景、`HomeView` 入口卡片、`GameView` 顶栏/底栏控件、`GameBoard` 牌桌与叠层、手牌/出牌区对比度与描边，使整体更偏 **暖色休闲** 而非冷色电竞感。
- 补充/替换 **栅格与矢量素材**（牌桌底纹、可选装饰条、主操作按钮底图参考），与 mood 板一致；在仓库中固定路径与命名。
- 更新或新增 **OpenSpec 能力** `client-ui-theme`，把「可感知的 UI 行为/对比度/主题一致性」写成可验证需求；**不**改变 `guandan-core` 中服务端权威状态与规则校验的语义。

## Capabilities

### New Capabilities

- `client-ui-theme`：描述客户端掼蛋主题与局内/局外关键界面的视觉与可感知体验要求（色板、圆角、主流程按钮、牌桌区域对比度、与参考风格的对齐关系），便于后续迭代与回归。

### Modified Capabilities

- （无）对局规则、Socket 协议与 `guandan-core` 中权威状态要求 **不** 因本变更修改；仅客户端表现层变更。

## Impact

- **代码**：`client/src/style.css`、`client/src/App.vue`、`client/src/views/HomeView.vue`、`client/src/views/GameView.vue`、`client/src/components/Game/*.vue`、部分 `client/src/assets/**`；可能新增 `client/src/assets/generated/` 或 `ui/theme` 类目录下的参考图与 token 说明。
- **资源体积**：若增加 PNG/WebP 背景与装饰，需关注包体与首屏；建议提供 WebP/压缩后资源。
- **依赖**：无新增 npm 依赖预期；不引入与 UI 无关的服务端变更。
