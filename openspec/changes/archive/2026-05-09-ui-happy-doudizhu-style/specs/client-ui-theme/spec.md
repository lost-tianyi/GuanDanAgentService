# client-ui-theme

## Purpose

定义掼蛋 Web 客户端在 **欢乐斗地主式休闲棋牌** 气质下的可感知 UI 要求（局外大厅、局内牌桌与主操作），不包含对局规则与服务端行为。

## ADDED Requirements

### Requirement: Theme tokens express warm casual palette

客户端 SHALL 通过全局 CSS 自定义属性定义至少一组可与代码引用对齐的主题变量，其中包括：**暖色主强调色**（用于主按钮与高亮边框）、**面板/顶栏深色中性色**（偏暖棕或深咖，而非纯冷灰蓝）、**牌桌区域叠层的高光或暗角**（允许继续使用栅格底图）。

#### Scenario: Variables are defined for accent and surfaces

- **WHEN** 开发者检查 `client/src/style.css`（或文档中指明的单一 token 源）
- **THEN** 存在可用于主按钮与顶栏/卡片的变量名约定（例如 `--ui-accent-*`、`--ui-panel-*`），且主强调色不为冷蓝单色作为主 CTA 唯一来源

### Requirement: Primary actions match casual card-game affordance

首页入口卡片与对局页 **出牌** 类主操作 SHALL 使用暖色渐变或饱和暖色填充，并具备圆角与阴影或高光以区别于次要按钮；次要操作 SHALL 使用较低对比的描边或半透明填充。

#### Scenario: Play button is visually primary in-game

- **WHEN** 用户处于可对局阶段且「出牌」按钮可用
- **THEN** 该按钮的视觉权重（饱和度/尺寸对比）不低于「要不起」等次要操作

### Requirement: Game shell reads as warm table not cold tech dashboard

对局区域（含 `GameBoard` 与顶栏） SHALL 整体呈现暖深背景或木/皮质面板感；牌桌叠层 SHALL 不单独依赖冷色线性渐变作为唯一氛围来源（允许冷色仅占叠层一小部分透明度）。

#### Scenario: Board area has warm overlay intention

- **WHEN** 用户进入完整显示牌桌的对局界面
- **THEN** 牌桌容器上存在可描述的暖色叠层或暖中性底色组合（实现可为渐变变量），与「深蓝科技感单色底」作为唯一背景的模式不同

### Requirement: Mood reference asset is retained for iteration

仓库 SHALL 保留一张用于风格对齐的参考图（可为生成 mood board），路径固定为 `client/src/assets/generated/ui-ref-happy-doudizhu-mood.png`，直至主题迭代不再需要时可由后续变更删除或替换。

#### Scenario: Reference file exists after theme change lands

- **WHEN** 本变更合并后的工作区干净构建
- **THEN** 上述路径文件存在且可被设计/开发用于比对（体积与格式以实现为准）
