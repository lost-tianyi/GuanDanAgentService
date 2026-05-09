# 惯蛋游戏 (Guandan Game)

一款支持本地 AI 和在线对战的惯蛋扑克牌游戏。

## 项目简介

惯蛋是流行于江苏、安徽等地的四人扑克牌游戏。本项目实现了一个完整的惯蛋游戏，支持：

- 人机对战（AI 对手）
- 四人在线匹配
- 实时聊天和表情
- 完整惯蛋规则

## 技术栈

### 前端
- Vue 3 + TypeScript
- Vite
- Pinia (状态管理)
- Socket.IO Client

### 后端
- Node.js + Express
- Socket.IO
- TypeScript

### AI
- 基础规则引擎
- 可选 LLM API 增强

## 游戏规则

### 基本规则
- 4 人参与，两副牌（108 张），每人 27 张
- 对家为队友，交叉坐
- 从 2 打 到 A，先打过 A 且满足条件者获胜

### 牌型
- 单张、对子、三张、三带二
- 顺子（5 张以上）
- 炸弹（4 张及以上同点数）
- 同花顺
- 四王（最大）

### 升级规则
- 双下（队友两人一二游）：升 3 级
- 头游 + 三游：升 2 级
- 头游 + 末游：升 1 级
- 打 A 时需要头游且队友不是末游

### 进贡规则
- 下游给上游最大牌，上游还 2-10 的牌
- 双下各进贡一张，还牌时大给头游，小给二游

## 项目结构

```
guandan/
├── client/                 # Vue 前端
│   ├── e2e/                # Playwright 端到端（需手动起服务）
│   ├── scripts/            # 短语音频生成等工具脚本
│   ├── src/
│   │   ├── assets/         # 静态资源（ui、audio/wav 等）
│   │   ├── audio/          # 播报与音效逻辑
│   │   ├── components/     # 组件（Game / Chat 等）
│   │   ├── composables/
│   │   ├── stores/
│   │   ├── types/
│   │   └── views/
│   └── package.json
├── server/
│   ├── src/
│   │   ├── game/           # 规则与状态机
│   │   ├── ai/
│   │   ├── coach/
│   │   └── socket/
│   └── package.json
├── docs/                   # PRD / HLD / LLD（教练 V1 设计文档）
├── openspec/               # OpenSpec：现状规格 specs/、变更提案 changes/
├── scripts/                # 根目录辅助脚本（如 e2e 包装）
├── Dockerfile              # 单容器镜像：前端静态 + 服务端
├── docker-compose.yml      # 本地/云端快速启动示例
├── README.md
└── package.json
```

### OpenSpec（规格驱动）

本项目引入 [OpenSpec](https://openspec.dev)：在 `openspec/specs/` 用能力规格描述「系统应如何表现」，在 `openspec/changes/` 跟踪每次功能变更的提案、设计与任务。详见 [`openspec/README.md`](openspec/README.md)。

- **Cursor**：`.cursor/commands/` 提供 `/opsx:propose`、`/opsx:apply`、`/opsx:archive` 等工作流（初始化后需重启 IDE）。
- **CLI**：仓库根目录执行 `npm install` 后可用 `npm run openspec -- <子命令>`，与官方 CLI 一致。

## 快速开始

### 安装依赖

```bash
# 安装根目录依赖
npm install

# 安装前端依赖
cd client && npm install

# 安装后端依赖
cd server && npm install
```

### 启动开发服务器

```bash
# 启动后端 (端口 3001)
npm run server

# 启动前端 (端口 5173)
npm run client
```

访问 http://localhost:5173 开始游戏。

### 生产构建

```bash
# 构建前端
npm run build

# 启动生产服务器
npm run start
```

### Docker 部署

在仓库根目录构建并运行（需已安装 Docker）：

```bash
docker build -t guandan:latest .
docker run -d --name guandan -p 3001:3001 \
  -v "$(pwd)/server/.env:/app/server/.env:ro" \
  guandan:latest
```

访问 `http://localhost:3001`。亦可使用 `docker compose up --build -d`。密钥放在 `server/.env`，勿打入镜像。详细说明见 [`README.zh-CN.md`](README.zh-CN.md) 第 8 节。

### 测试

```bash
# 服务端单元测试（Vitest）
npm run test

# 前端 E2E（需先启动 server:dev 与 client:dev）
cd client && npm run test:e2e
```

## 功能说明

### 游戏模式
- **本地对战**: 与 AI 对手进行双人/四人游戏
- **在线匹配**: 创建房间或加入房间进行网络对战

### AI 难度
- **简单**: 基于基础规则的随机出牌
- **普通**: 优化的出牌策略
- **困难**: 使用 LLM API 的智能对手（需配置 API Key）

### 聊天功能
- 文字消息发送
- 内置表情包
- 游戏状态提示

## 配置说明

### LLM AI 配置（可选）

在 `server/.env` 中配置：

```env
OPENAI_API_KEY=your-api-key
# 或
ANTHROPIC_API_KEY=your-api-key
```

### 环境变量

```env
# server/.env
PORT=3001
CLIENT_URL=http://localhost:5173
```

## 开发指南

### 添加新的牌型

在 `server/src/game/rules.ts` 中添加牌型定义，并在 `judge.ts` 中实现判断逻辑。

### 添加新的表情

在 `client/src/components/Chat/EmojiPicker.vue` 的表情列表中添加。

## 许可证

MIT License
