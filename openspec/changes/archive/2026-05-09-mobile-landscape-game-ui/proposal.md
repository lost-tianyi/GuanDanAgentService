## Why

手机浏览器上对局界面沿用桌面壳层时出现画布未铺满、音频控件落在「牌桌外」、触控区与沉浸感不足等问题。需要在 **不改变桌面端布局与操作路径** 的前提下，为 **手机横屏** 提供基于已定前端原型（全幅牌桌 + 顶栏/本家叠层）的对局壳层，并用单元测试与 E2E 锁定回归。

## What Changes

- **桌面端（电脑浏览器）**：对局路由下的现有 UI 结构、样式与交互 **保持不变**（非功能性重构一律不做）。
- **手机竖屏**：沿用现有「建议横屏游玩」全屏遮罩与不可操作语义；行为与文案 **保持现有规格**（`client-mobile-viewport`）。
- **手机横屏**：实现对局页 **专用壳层**，将 `GameBoard`、手牌、主操作、顶栏工具（含语音播报 / BGM）纳入 **同一视口牌桌画布** 内的叠层布局，对齐 `client/public/mobile-ui-prototype.html` 的空间分工。
- **测试**：扩展 **Vitest**（视口/形态判定、壳层分支逻辑）与 **Playwright**（竖屏遮罩 / 横屏可玩 / 桌面布局未被移动壳层替换），直至 CI 或文档约定命令下全部通过。

## Capabilities

### New Capabilities

- `client-mobile-landscape-shell`: 定义手机横屏对局专用壳层（全视口 felt、顶栏叠层、本家操作区、与桌面 DOM 路径分叉、音频控件纳入壳层），以及验收场景。

### Modified Capabilities

- `client-game-shell`: 细化「对局壳层 chrome」在 **手机横屏** 下的含义（音频控件必须处于横屏壳层顶栏/工具区），并与桌面端「保持不变」并列表述，便于归档与测试对标。

## Impact

- **前端**：`client/src/views/GameView.vue`、`GameBoard.vue`、布局与移动端相关 composable（如 `useMobileLandscape*`）、全局音频控件挂载位置；可能新增 `MobileLandscapeGameShell`（命名以实现为准）及样式模块。
- **测试**：`client` 下 Vitest、`tests/e2e` Playwright；必要时新增稳定 `data-testid`。
- **静态原型**：`client/public/mobile-ui-prototype.html` 作为视觉与空间参考，不作为运行时依赖。
- **服务端**：无。
