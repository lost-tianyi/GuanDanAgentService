# client-game-shell（delta）

本文件为变更 `mobile-landscape-game-ui` 对既有能力 `client-game-shell` 的增量规范；归档后应与 `openspec/specs/client-game-shell/spec.md` 合并理解。

## MODIFIED Requirements

### Requirement: Voice and BGM controls live inside the game chrome on the game route

在对局页，**出牌语音播报**与 **背景音乐** 开关 SHALL 出现在 **对局壳层 chrome** 内：在 **桌面端** 为顶栏工具区或与顶栏同一列宽的控件条；在 **手机形态且横屏**（竖屏引导未遮挡时）为手机横屏对局壳层 **顶栏叠层** 或与顶栏同一视觉列的工具区内。SHALL NOT 作为唯一呈现方式长期孤立悬浮在 **与牌桌主画布水平不对齐** 的视口空白边带中。

#### Scenario: Audio toggles align with game header or board column

- **WHEN** 用户在对局页可见顶栏与牌桌（桌面端布局）
- **THEN** 语音与 BGM 控件的命中区域位于对局壳层布局树内或与牌桌列右缘对齐的 intentionally 设计区域内（由自动化测试用稳定选择器验收）

#### Scenario: Mobile landscape keeps audio inside felt chrome

- **WHEN** 用户为手机形态且横屏且未显示竖屏引导层
- **THEN** 语音与 BGM 控件位于手机横屏对局壳层顶栏叠层子树内，而非单独悬浮于 felt 主画布外的空白侧带（由自动化测试验收）
