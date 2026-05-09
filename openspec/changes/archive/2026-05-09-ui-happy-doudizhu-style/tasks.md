## 1. Tokens and global chrome

- [x] 1.1 在 `client/src/style.css` 的 `:root` 增加欢乐斗地主向 token（暖金主色、深咖/暖面板、可选 `--ui-felt-warm`），并保留与现有 `--success-color` 等语义色的兼容注释
- [x] 1.2 调整 `App.vue` 中 `body` 背景为暖深渐变或深色渐变中含褐色分量，避免纯冷蓝紫主导
- [x] 1.3 固定悬浮「播/静」「BGM」按钮边框色为暖中性或与 token 一致

## 2. Home and lobby

- [x] 2.1 `HomeView.vue`：菜单卡片边框/hover 高光改为橙金系变量；标题金色可与 `--ui-accent-*` 对齐
- [x] 2.2 难度选择与弹窗按钮使用主强调 token，替换纯蓝 hover 作为唯一强调

## 3. In-game shell and controls

- [x] 3.1 `GameView.vue`：顶栏 `game-header` 背景与文字对比符合暖面板规范；底栏 `.control-btn.play` 使用渐变主按钮样式；`.pass`/次要按钮使用次级样式
- [x] 3.2 `GameView.vue`：进贡/教练等与主流程按钮的视觉层级与 design 一致（主 vs 次）

## 4. Board and felt overlay

- [x] 4.1 `GameBoard.vue`：`game-board__surface` 上渐变叠层加入可控暖色径向/线性分量（变量化），与现有 PNG cover 共存
- [x] 4.2 校验 `container` 查询下背景 focal 在暖叠层下仍无明显违和（目视即可）

## 5. Assets and documentation

- [x] 5.1 确认 `client/src/assets/generated/ui-ref-happy-doudizhu-mood.png` 已入库；可选在 `openspec/changes/ui-happy-doudizhu-style/design.md` 或 README 片段中注明「仅供内部对齐」
- [x] 5.2 运行 `npm run client` 与 `npm run build`（client）通过；关键路径目视：首页 → 本地开局 → 出牌/要不起
