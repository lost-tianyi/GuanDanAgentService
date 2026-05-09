## Context

**现状（代码探索摘要）**

| 区域 | 主要文件 | 当前气质 |
|------|-----------|-----------|
| 全局背景与变量 | `style.css`（`--primary-color` 蓝、`--bg-color` 深蓝紫）、`App.vue`（body 渐变） | 冷色偏「科技感」 |
| 首页 | `HomeView.vue` | 金色标题 `ffd700` + `card-bg` 卡片；按钮 hover 蓝高光 |
| 对局页框架 | `GameView.vue` | 顶栏信息条 `card-bg`、底栏「出牌/要不起」等 `control-btn` |
| 牌桌 | `GameBoard.vue` | `game-board__surface` 绒面 PNG + 深蓝渐变叠层；圆角 16px |
| 手牌 / 出牌 | `HandCards.vue`、`PlayedCards.vue` | 白边扑克样式 + SVG 花色 |
| 玩家信息 | `PlayerInfo.vue`（未全文展开） | 与顶栏色系一致 |
| 聊天 | `ChatWindow.vue` | `primary-color` 强调 |

整体：**深蓝灰底 + 蓝色主操作 + 深色牌桌**，与「欢乐斗地主」常见的 **暖木侧栏、高饱和绿桌、橙金主按钮、偏卡通描边** 不一致。

**约束**：不改变 Socket/规则；仅前端样式与资源；需兼顾桌面与中等宽度移动端。

**风格参考素材**：已在仓库内放置生成图 mood board（**仅供内部对齐配色与气质，非腾讯官方素材、不作对外发行美术**）：

- `client/src/assets/generated/ui-ref-happy-doudizhu-mood.png`

## Goals / Non-Goals

**Goals:**

- 建立 **欢乐斗地主向** 的 token：主色改为 **橙金系**（主按钮、强调）、辅助 **暖绿/嫩绿**（牌桌或高光）、中性背景 **暖深棕或浅木纹叠层**，替代大面积冷蓝灰。
- **首页与大厅**：菜单卡片更像「木质或皮质面板 + 金色标题」，hover 用橙黄高光而非纯蓝。
- **局内**：顶栏改为 **半透明木色条或深咖条 + 金色细描边**；底栏主按钮 **橙黄渐变 + 厚圆角 + 轻外发光**；次要按钮灰褐描边。
- **牌桌**：在现有 PNG/Cover 结构上，叠层改为 **偏暖的径向高光**（可选轻微 vignette），避免「午夜赌场」感。
- **组件一致性**：`border-radius` 统一到 **12–20px** 区间；主要 CTA **最小触控高度 ≥ 44px**（已在 px 上接近则保留）。

**Non-Goals:**

- 不重绘全部扑克矢量资源（花色 SVG 可保留）；不替换语音/音效逻辑。
- 不复制腾讯「欢乐斗地主」商标、角色 IP 或包体美术；仅 **气质对齐**。
- 不在本设计稿内实现全部像素稿（实现见 `tasks.md`）。

## Decisions

1. **Token 存放**：以 `:root` CSS 变量扩展为主（`--ui-accent-gold`、`--ui-felt-highlight`、`--ui-panel-wood` 等），集中在 `style.css` 与必要时 `GameView`/`HomeView` scoped 覆盖；**不**引入重型 CSS-in-JS 框架。  
   - *备选*：Tailwind — 迁移面大，否决。

2. **牌桌底图**：保留 `gameFeltPhoto` 机制；增强 **暖色叠层**（低不透明 orange/brown gradient），而非替换为单一冷渐变。  
   - *备选*：纯矢量 SVG 桌布 — 与「摄影绒面」目标不符。

3. **主按钮**：使用 **线性渐变**（`#f5c542` → `#e8940c`）+ `box-shadow` 模拟欢乐斗地主式凸起；`:active` 略压暗。  
   - *备选*：纯色扁平 — 辨识度不足。

4. **生成素材用法**：mood 图仅作 **设计与配色取样**；上线道具图标仍以 **自绘 SVG 或压缩 PNG** 分批替换，避免大图进 bundle。

## Risks / Trade-offs

| 风险 | 缓解 |
|------|------|
| 暖色过多导致对比度不足（WCAG） | 正文保持白/浅灰；按钮用大字号；关键状态保留绿色「出牌成功」语义 |
| PNG 体积拖慢首屏 | WebP/压缩；`loading="lazy"` 非首屏装饰 |
| 与用户已习惯的深蓝主题冲突 | 变更集中在同一 OpenSpec 变更内一次性交付；README 可一句话说明 |

## Migration Plan

1. 合并后开发者本地 `npm run client` 目视回归：首页 → 建房 → 完整一局。  
2. 无服务端迁移；回滚即 revert 前端样式提交。

## Open Questions

- 是否在下一步单独增加 **「简洁模式」**（保留旧冷色主题）作为用户可选主题？（本变更默认不实现，可在后续 change 提出。）
