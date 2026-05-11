## 1. 基线与验收命令

- [x] 1.1 阅读 `openspec/changes/mobile-landscape-game-ui/proposal.md`、`design.md` 与 `specs/**` 增量，确认与 `openspec/specs/client-mobile-viewport/spec.md` 无冲突
- [x] 1.2 记录并执行本变更的验收命令：`client` 下 Vitest、E2E（Playwright）及与 CI 一致的脚本

## 2. 壳层实现（桌面不变 / 手机横屏新壳）

- [x] 2.1 在 `GameView`（或对局唯一入口）引入「桌面 vs 手机横屏可玩」分支：桌面保持现有单一模板与样式路径
- [x] 2.2 新增手机横屏壳层组件（命名以代码为准），结构对齐 `client/public/mobile-ui-prototype.html`：全视口 `felt`、顶栏叠层、`player-zone`（操作行 + 手牌横向区）
- [x] 2.3 将既有 `GameBoard`、`HandCards`、出牌/过/托管等 **逻辑与事件** 迁入壳层对应插槽或子区域，避免复制游戏逻辑
- [x] 2.4 将 **语音播报、BGM** 控件移入横屏壳层 **顶栏工具区**（或与顶栏同一 chrome 树），消除「画布外」孤立漂浮
- [x] 2.5 核对 `layout-scale-stage` / `useMobileLandscapeUniformScale`：避免双重缩放；必要时仅保留单一缩放根（壳层未新增第二缩放根）

## 3. 竖屏引导（保持既有行为）

- [x] 3.1 确认手机竖屏仍展示全屏横屏引导层且遮挡操作；仅回归测试，不改文案与判定除非缺陷修复

## 4. 单元测试（Vitest）

- [x] 4.1 抽取或复用「是否使用手机横屏专用壳层」判定，编写覆盖桌面 / 手机竖屏（遮罩）/ 手机横屏的用例
- [x] 4.2 确保与现有 `client-mobile-viewport` 相关纯函数测试风格一致

## 5. 浏览器自动化（Playwright）

- [x] 5.1 为横屏壳层根节点添加稳定 `data-testid`（或仓库约定选择器）
- [x] 5.2 扩展或新增用例：移动视口竖屏 → 引导可见；切换横屏尺寸 → 引导消失且可对局交互
- [x] 5.3 新增或扩展用例：桌面视口对局页 **断言不存在** 移动横屏壳层标识
- [x] 5.4 （可选）断言语音/BGM 控件在壳层顶栏 bounding box 内或与 design 一致的区域

## 6. 收尾

- [x] 6.1 本地与 CI 全绿后更新变更说明或 PR 描述，列出Breaking：**无**（桌面路径不变）
- [x] 6.2 运行 `/opsx:apply` 进入实现阶段或按团队流程开 PR
