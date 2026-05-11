# client-mobile-landscape-shell

## Purpose

定义 **手机形态 + 横屏** 下对局页专用壳层：全视口牌桌 felt、顶栏与本家区叠层、与 **桌面端布局分叉**；不包含竖屏引导（由 `client-mobile-viewport` 覆盖）。

## Requirements

### Requirement: Desktop-class clients keep the existing game route shell

系统 SHALL 在判定为 **非手机形态（桌面端）** 时，对局路由 **不得** 将「手机横屏专用壳层」作为主编排容器；现有 `GameView` / `GameBoard` 壳层结构 SHALL 保持不变。

#### Scenario: Desktop route does not mount mobile landscape shell root

- **WHEN** 用户在桌面端浏览器打开对局页且未显示竖屏引导
- **THEN** DOM 中 **不得** 出现仅供手机横屏壳层使用的稳定标识（例如约定的 `data-testid="mobile-landscape-game-shell"`），自动化测试 SHALL 断言该条件

### Requirement: Phone landscape presents a single full-viewport felt shell

在 **手机形态**、**横屏**（宽度不小于高度）、且 **竖屏引导层未显示** 时，对局路由 SHALL 使用专用壳层：单一 **felt** 根容器铺满当前 **壳层可用视口**（含 `safe-area` 内边距策略），主牌桌视觉背景 SHALL 连续延伸至本家手牌叠层下方，SHALL NOT 再单独占用一条与 felt **色相割裂** 的固定页脚 flex 行承载手牌区。

#### Scenario: Hand strip lives inside felt overlay stack

- **WHEN** 用户在对局页处于手机横屏可玩状态
- **THEN** 本家手牌带的包围盒 SHALL 位于 felt 根容器坐标系内（叠层底部），而非 felt 之外的并列兄弟块导致底部出现非桌布底色条带（由布局/E2E 验收）

### Requirement: Overlay chrome stacks above felt

手机横屏壳层 SHALL 将 **顶栏**（房间信息、返回/音效、**语音播报与 BGM 控件**）置于 felt **上方**的叠层；将 **本家主操作行**（出牌、不出、托管及产品设计要求的次要入口如手牌/教练）与 **横向手牌带** 置于 felt **底部**的 **player-zone** 叠层；中央与四角留给 `GameBoard` 既有子布局。

#### Scenario: Audio controls are inside top overlay

- **WHEN** 用户在对局页处于手机横屏可玩状态且音频控件可见
- **THEN** 语音播报与 BGM 开关的命中区域 SHALL 落在顶栏叠层子树内（与 `client-game-shell` 一致）

### Requirement: Shell selection logic is unit-tested

用于判定「是否渲染手机横屏专用壳层」的逻辑 SHALL 能被 **Vitest** 在注入视口尺寸与形态标记的情况下独立测试；至少覆盖：桌面 → 不挂载；手机 + 竖屏（遮罩显示时）→ 不进入横屏可玩壳层；手机 + 横屏 → 进入壳层（与实现的条件一致）。

#### Scenario: Tests cover shell branch predicates

- **WHEN** 开发者运行客户端单元测试
- **THEN** 至少存在用例断言上述分支之一且与生产判定函数同源（非重复硬编码）

### Requirement: Shell behavior is covered by browser automation

手机横屏壳层与桌面 **不分叉误挂** SHALL 由 **Playwright**（或仓库等价 E2E）验收：竖屏显示引导 → 切横屏可交互；桌面对局页 **无** 移动专用壳层标识。

#### Scenario: E2E distinguishes desktop and mobile landscape

- **WHEN** 维护者运行文档约定的 E2E 套件
- **THEN** 存在用例验证竖横屏切换路径；存在用例验证桌面对局页不包含移动横屏壳层根标识

## Notes

- 静态原型 `client/public/mobile-ui-prototype.html` 为空间与层级参考，非运行时依赖。
