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

根目录已声明 `@fission-ai/openspec` 为开发依赖，推荐使用：

```bash
npm install          # 仓库根目录
npm run openspec -- --help
```

全局安装亦可：`npm install -g @fission-ai/openspec@latest`。

## 遥测（可选关闭）

```bash
export OPENSPEC_TELEMETRY=0
# 或
export DO_NOT_TRACK=1
```
