## Context

- 根组件 `App.vue` 使用 `position: fixed` 放置语音与 BGM 按钮（`z-index: 9999`），与路由内容兄弟关系；对局页 `GameView` 使用 `.game-container { max-width: 1200px; margin: 0 auto }`，宽屏下牌桌块宽度小于视口。
- 已有 `PortraitRotateGate` 与 `layout--mobile-*` 壳层；本变更不得破坏移动端横竖屏逻辑。

## Goals / Non-Goals

**Goals:**

- 对局页：主牌桌区域在常见桌面与手机横屏下 **横向尽可能满宽**，纵向在顶栏、底控、手牌区约束下 **最大化 `GameBoard` 可视面积**。
- 语音 / BGM：**视觉上归属对局 chrome**（顶栏内或紧贴顶栏与牌桌同一列宽），玩家感知为「牌桌 UI 的一部分」。
- **可测**：关键布局约束有可自动化断言（尺寸比例、控件包围盒）。

**Non-Goals:**

- 不改变出牌规则、Socket 协议与教练逻辑。
- 不要求首页 `HomeView` 采用与对局完全相同的满屏策略（可维持居中卡片大厅），除非任务明确扩展。

## Decisions

1. **满宽策略**  
   - **选用**：对局容器 `.game-container` 去除或显著提高 `max-width`，改为 `width: 100%`，水平方向仅保留 **较小 padding** 与 **`env(safe-area-inset-*)`**。  
   - **备选**：保留 `max-width` 但同步把音频按钮锚定到容器右缘 —— 仍不如满宽沉浸，不作为首选项。

2. **音频控件归属**  
   - **选用**：在对局路由将播报 / BGM **移入 `GameView` 顶栏**（或顶栏扩展一行工具区），`App.vue` 在非对局路由仍可保留全局按钮，或通过 `router-view` 布局避免重复。  
   - **备选**：保留 `App.vue` 固定定位但用脚本计算与 `.game-container` 右对齐 —— 复杂且 fragile，否决。

3. **首页与对局切换**  
   - **选用**：依据当前路由（`name === 'game'` 或 path）**仅在首页显示全局音频按钮、对局页显示嵌入顶栏的一组按钮**（或反之统一迁至布局组件），避免两套按钮叠加。

4. **测试**  
   - **Vitest**：若抽出「是否为对局路由」或壳层 class 辅助函数则测之；否则以 **Playwright** 为主：全屏桌面宽度下 `.game-container` 宽度与 `innerWidth` 比例阈值、顶栏内存在 `data-testid` 音频按钮、对局页仍可点击出牌链。

## Risks / Trade-offs

- **Risk**：极窄窗口下顶栏拥挤 → **Mitigation**：图标化或使用折叠菜单；保留最小触控 44px（与 mobile 规格一致）。
- **Risk**：Playwright 与环境分辨率相关 → **Mitigation**：断言用比例而非绝对像素。

## Migration Plan

1. 合并后用户刷新即可；无数据迁移。
2. 若 CI 无浏览器二进制，在 `tasks.md` / README 中标注 Playwright 安装命令。
