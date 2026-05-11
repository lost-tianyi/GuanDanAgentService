# client-ui-theme（delta）

本文件仅包含对既有能力 **client-ui-theme** 的 **新增** 需求；归档合并时将并入主规格。

## ADDED Requirements

### Requirement: Warm theme persists on mobile landscape shell

在启用 **client-mobile-viewport** 所定义的手机横屏壳层时，首页与对局页 SHALL **继续使用** `client/src/style.css`（或单一 token 源）中的 **暖色强调与面板变量**（如 `--ui-accent-*`、`--card-bg`）；横屏下的额外间距与缩放 SHALL **不**将主 CTA 替换为冷蓝单色主导。

#### Scenario: Accent tokens still drive primary buttons on mobile landscape

- **WHEN** 用户在手机横屏下查看首页或对局页
- **THEN** 主按钮与高亮边框仍引用既有暖色 token 体系，与桌面端欢乐斗地主向气质一致
