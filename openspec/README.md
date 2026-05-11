# OpenSpec（本仓库）

本仓库采用 **[OpenSpec](https://openspec.dev)** 作为轻量级规格驱动约定：`openspec/specs/` 描述系统**当前应具备的行为**，`openspec/changes/` 存放每一次变更的提案、设计与任务（详见官方 [Getting Started](https://github.com/Fission-AI/OpenSpec/blob/main/docs/getting-started.md)）。

## 目录约定

| 路径 | 作用 |
|------|------|
| `openspec/specs/<能力名>/spec.md` | 能力级规格（可与 PRD/HLD 并存，偏运行时可检索） |
| `openspec/changes/<变更-id>/` | 进行中的变更（`proposal.md`、`design.md`、`tasks.md`、规格增量等） |
| `openspec/changes/archive/` | 已归档变更 |

## Cursor 集成

初始化时已写入 `.cursor/commands/`（如 `/opsx:propose`、`/opsx:apply`、`/opsx:archive`）与 `.cursor/skills/openspec-*`。**重启 Cursor** 后斜杠命令生效。

## CLI（项目内）

根目录已声明 `@fission-ai/openspec` 为开发依赖。CLI 可执行文件在 **`node_modules/.bin/openspec`**，不会自动进入系统 `PATH`，因此 **在终端直接输入 `openspec` 可能报 `command not found`**。可按下面任一方式使用。

### 推荐（无需改 PATH）

在**仓库根目录**（与根 `package.json` 同级）执行：

```bash
npm install
npm run openspec -- --help
npm run openspec -- list
npm run openspec -- status --change "immersive-game-canvas-full-bleed" --json
```

`--` 后面的参数会原样传给 `openspec`。

### 等价写法

```bash
cd /path/to/guandan
npx openspec --help
./node_modules/.bin/openspec list
```

### 全局安装（可选）

若希望随处执行 `openspec`：

```bash
npm install -g @fission-ai/openspec@latest
```

全局版本与项目依赖版本可能不一致，以团队约定为准。

### Cursor / 自动化脚本

在 Cursor 终端或非交互脚本里，优先使用 **`npm run openspec -- <子命令>`**，避免依赖当前 shell 的 PATH。

## 遥测（可选关闭）

```bash
export OPENSPEC_TELEMETRY=0
# 或
export DO_NOT_TRACK=1
```
