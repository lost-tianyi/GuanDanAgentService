# client-game-shell（delta）

归档合并时将并入 `openspec/specs/client-game-shell/spec.md`（若尚不存在则新建能力目录）。

## Purpose

定义 **对局路由** 下客户端 **主牌桌壳层** 与 **全局音频控件** 的空间关系：沉浸铺满与安全可用，不包含对局规则。

## ADDED Requirements

### Requirement: Game route shell uses full viewport width for the board column

在用户处于 **对局页面**（人机或在线房间）且非竖屏阻挡态时，承载 `GameBoard` 的主壳层 SHALL **使用视口可用宽度** 呈现牌桌列， SHALL NOT 因任意固定 **`max-width`**（例如历史遗留的约 1200px 居中栏宽）在常见桌面浏览器两侧保留大块对称空白，除非规格化的窄屏回退路径另有说明。

#### Scenario: Wide desktop shows minimal side gutters

- **WHEN** 用户在宽度不小于 1280px 的桌面浏览器打开对局页且未显示竖屏全屏引导
- **THEN** 主对局容器内容区可用宽度占视口宽度的比例不低于团队约定的阈值（实现与验收测试中对同一阈值一致），且牌桌区域视觉上为主要横向占据元素

### Requirement: Voice and BGM controls live inside the game chrome on the game route

在对局页，**出牌语音播报**与 **背景音乐** 开关 SHALL 出现在 **对局壳层 chrome**（例如顶栏工具区或与顶栏同一列宽的控件条）内， SHALL NOT 作为唯一呈现方式长期孤立悬浮在 **与牌桌块水平不对齐** 的视口空白边带中。

#### Scenario: Audio toggles align with game header or board column

- **WHEN** 用户在对局页可见顶栏与牌桌
- **THEN** 语音与 BGM 控件的命中区域位于对局壳层布局树内或与牌桌列右缘对齐的 intentionally 设计区域内（由自动化测试用稳定选择器验收）

### Requirement: Layout regression protection

对上述壳层行为 SHALL 提供 **浏览器自动化** 验收（Playwright 或仓库等价框架），并在可行时辅以 **Vitest** 覆盖抽取的纯逻辑。

#### Scenario: CI or local script runs layout checks

- **WHEN** 维护者执行文档约定的 E2E 命令
- **THEN** 至少一条用例验证对局页主容器相对视口宽度与音频控件位置约束
