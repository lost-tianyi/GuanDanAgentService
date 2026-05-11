## Context

仓库已有 **竖屏横屏引导**（`client-mobile-viewport`）、**对局壳层与音频控件位置**（`client-game-shell`）及 **`mobile-ui-prototype.html`** 空间原型。当前 Vue 对局页在手机横屏仍大致沿用桌面结构，导致画布占比、控件归属与规格不一致。

## Goals / Non-Goals

**Goals:**

- **桌面端**：对局页 DOM/CSS/交互路径 **零意图变更**（回归测试锁定）。
- **手机竖屏**：保持现有「建议横屏」遮罩与不可操作语义。
- **手机横屏**：用 **独立壳层组件**（或与 `GameView` 条件渲染分支）拼装：`felt` 铺满可用视口，顶栏绝对叠层，本家 **操作条 + 手牌** 落在 `player-zone` 叠层内；`GameBoard`/手牌/播放逻辑 **复用现有子组件**，避免重写规则 UI。
- **音频**：语音播报与 BGM 出现在 **横屏壳层顶栏工具区**（与原型一致），不再落在牌桌外的孤立侧带。
- **测试**：Vitest 覆盖形态/分支判断；Playwright 覆盖竖→横、桌面未被移动壳层替换、音频控件在壳层内。

**Non-Goals:**

- 不改变服务端协议或出牌规则。
- 不要求本次迭代完成「欢乐斗地主」全部美术替换；视觉以现有主题变量与原型对齐即可。
- 不对平板（非 phone-class）强制使用手机横屏壳层，除非既有判定已覆盖（以实现为准）。

## Decisions

1. **壳层分叉位置**：在 **`GameView`（或对局唯一入口视图）** 用已有「手机 + 横屏 + 非竖屏遮罩」条件渲染 **`MobileLandscapeGameShell`**（暂定名）包裹 `GameBoard` 与现有子组件；桌面走 **原有模板**。  
   **备选**：路由级子路由 —— 拒绝，避免重复连接房间逻辑。

2. **样式来源**：以 **`mobile-ui-prototype.html`** 的 flex/absolute/`safe-area`/渐变分层为 **空间契约**；实现用 **scoped CSS + 现有 CSS 变量**，避免复制粘贴整页 HTML。

3. **控件平移**：手牌/教练（若存在）与 **出牌、不出、托管** 同排的策略已在原型中体现 —— Vue 侧将对应按钮迁入横屏壳层 **`.actions`** 区域，行为仍调用现有 composable/store。

4. **缩放**：若现有 **`layout-scale-stage` / `useMobileLandscapeUniformScale`** 仍在使用，横屏壳层 **内部根节点** 作为 scale 容器，避免双重缩放；具体以当前 `GameView` 实现为准，在实现任务中核实。

5. **测试策略**：  
   - **Vitest**：对「是否使用手机横屏壳层」抽取纯函数或与现有模块一致的可 mock 入口。  
   - **Playwright**：沿用仓库 mobile orientation 用例风格；为壳层根增加 **`data-testid="mobile-landscape-game-shell"`**（或等价），桌面断言 **不存在** 该节点。

## Risks / Trade-offs

- **[Risk] 条件渲染遗漏导致桌面误入移动壳层** → **Mitigation**：desktop / mobile 两条 E2E；Vitest 覆盖判定边界。  
- **[Risk] Teleport（如竖屏门）与绝对定位叠层冲突** → **Mitigation**：实现任务中检查 `Teleport` 目标与 z-index；E2E 横屏路径点按主按钮。  
- **[Risk] 触控目标缩小** → **Mitigation**：壳层按钮保持 ≥44×44 CSS px（规格已有）。

## Migration Plan

1. 功能分支合并前：`npm run test`（client）与 E2E 文档命令全绿。  
2. 若线上异常：**特性开关**（可选）在实现阶段评估；若无开关，则通过 revert 或快速关闭移动壳层条件（仅存代码路径）回滚。

## Open Questions

- **平板横屏**：是否并入 phone-class 判定需与现有 `use-is-phone`（或等价）一致；若不一致，在 tasks 中单独验收一条 E2E。  
- **教练面板**：全屏 modal 是否仍 `Teleport` 到 `body` —— 实现时确认不挡住竖屏门逻辑。
