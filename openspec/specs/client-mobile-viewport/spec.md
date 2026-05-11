# client-mobile-viewport

## Purpose

定义 Web 客户端在 **手机浏览器** 下的 **方向引导**、**横屏壳层布局** 与 **触控可验收** 行为；与 `client-ui-theme` 暖色气质兼容，不包含对局规则。

## Requirements

### Requirement: Portrait orientation shows rotate guidance on phone-class clients

在判定为 **手机形态** 且视口为 **竖屏（高度大于宽度）** 时，客户端 SHALL 展示一层覆盖全屏的 **横屏引导界面**，遮挡下方游戏内容；引导文案 SHALL 明示建议旋转设备至横屏以获得更佳体验（欢乐斗地主式休闲棋牌语境）。

#### Scenario: Overlay blocks interaction in portrait

- **WHEN** 客户端判定为手机形态且当前为竖屏
- **THEN** 用户无法操作被遮挡区域内的游戏控件（出牌、菜单等），直至满足横屏条件或本节其它需求允许的退出条件

#### Scenario: Overlay hides in landscape on phone

- **WHEN** 同一手机形态会话下用户将设备旋转至横屏（宽度大于等于高度）
- **THEN** 横屏引导界面不再遮挡主界面，主游戏界面可操作

### Requirement: Mobile landscape shell adapts touch and safe areas

在手机形态且 **横屏** 时，客户端 SHALL 为首页与对局页提供适配：**主要操作控件**（出牌、要不起、托管、教练入口等）点击区域 SHALL 满足不小于 **44×44 CSS 像素** 等效的触控目标（可通过 padding 扩大热区）；布局 SHALL 考虑 **safe-area-inset**（刘海与底部横条），避免控件贴边不可点。

#### Scenario: Primary controls have adequate tap targets in landscape

- **WHEN** 用户在对局页横屏且轮到本人可操作
- **THEN** 「出牌」「要不起」等主流程按钮的可点区域不低于 44×44 CSS 像素等效（允许合并相邻视觉小组件）

### Requirement: Viewport logic is testable without a physical device

方向与「是否展示竖屏遮罩」的核心判定 SHALL 能从 **窗口尺寸与 User-Agent / userAgentData** 抽象为可单元测试的纯函数或等价模块；仓库 SHALL 包含针对该判定逻辑的自动化测试（Vitest），并在变更说明中列出如何在 CI 中执行。

#### Scenario: Unit tests cover portrait predicate

- **WHEN** 开发者运行客户端单元测试套件
- **THEN** 至少存在用例覆盖「手机 + 竖屏 → 需遮罩」与「手机 + 横屏 → 不需遮罩」的判定输出（通过注入或 mock 尺寸与 UA）

### Requirement: Browser automation validates orientation UX

客户端 SHALL 提供基于 Playwright（或仓库已采纳的 E2E 框架）的端到端用例，在 **模拟移动视口** 下验证：竖屏时出现引导层、切换到横屏尺寸后引导层消失且关键路由可交互（至少覆盖首页或对局页一条路径，与现有 E2E 约定一致）。

#### Scenario: E2E passes for orientation toggle path

- **WHEN** 维护者在文档约定命令下运行 E2E（含启动前后端或使用既有脚本）
- **THEN** 与竖横屏引导相关的用例全部通过且无跳过（除非平台不支持时在 tasks 中明确标注）
