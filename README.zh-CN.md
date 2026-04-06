# Guandan 项目说明（中文）

## 1) 项目简介
Guandan 是一个前后端分离的掼蛋项目，包含：
- `client`：Vue 3 + Vite 前端，负责房间、对局 UI、手牌交互、Socket 通信。
- `server`：Node.js + TypeScript + Socket.IO 服务端，负责规则判定、回合推进、AI 出牌、教练提示。

根据当前 PRD/HLD/LLD（`guandan-coach-v1` 系列文档），V1 重点为：
- 支持本地人机对战（`mode=local`）。
- 增加“教练提示（Guandan Coach）”：推荐出牌 + 解释理由。
- 教练在 `mode=online` 下默认不开放。

## 2) 核心能力
- 规则引擎：服务端统一执行 `analyzePattern` / `canBeat` 等判定。
- 回合系统：处理出牌、不出、轮转、开新圈、进贡等流程。
- AI 出牌：
  - 优先规则 AI（`BasicAI`）。
  - 兜底逻辑可在规则无法落子时回退到大模型建议（取决于服务端配置）。
- 教练能力（V1）：
  - 仅在 `mode=local` 且轮到人类玩家时可请求。
  - 输出 `recommended + reason`，LLM 失败时回退模板解释。

## 3) 文档索引（PRD / HLD / LLD）
- PRD: `guandan/PRD-guandan-coach-v1.md`
- HLD: `guandan/HLD-guandan-coach-v1.md`
- LLD: `guandan/LLD-guandan-coach-v1.md`

## 4) 运行环境
- Node.js 18+（建议 20+）
- npm 9+

## 5) 安装依赖
在两个子项目分别安装依赖：

```bash
cd guandan/client
npm install

cd ../server
npm install
```

## 6) 启动方式（开发）
需要前后端同时启动（建议开两个终端）。

### 6.1 启动服务端
```bash
cd guandan/server
npm run dev
```

### 6.2 启动前端
```bash
cd guandan/client
npm run dev
```

启动后按 Vite 输出访问前端地址（通常是 `http://localhost:5173`）。

## 7) 常用命令

### 7.1 Client
```bash
cd guandan/client
npm run dev       # 本地开发
npm run build     # 生产构建（含 vue-tsc）
npm run preview   # 预览构建产物
npx vue-tsc --noEmit  # 类型检查
```

### 7.2 Server
```bash
cd guandan/server
npm run dev       # 开发热更新（tsx watch）
npm run build     # TypeScript 编译到 dist
npm run start     # 启动 dist 服务
npx tsc --noEmit  # 类型检查
```

## 8) 配置说明（摘要）
服务端常见开关（详见 `server/src/config/env.ts`）：
- `COACH_HINT_ENABLED`：是否开启教练能力。
- `COACH_USE_LLM`：是否启用 LLM 解释/建议。
- `COACH_REASON_TIMEOUT_MS`：教练请求超时。
- `OPENAI_API_KEY`（或相应 provider key）：LLM 密钥。

前端 BGM（当前目录音频相关）：
- 默认读取 `client/public/audio/bgm.mp3`。
- 或使用 `VITE_BGM_URL` 指向远端 mp3。

## 9) 快速排障
- 前端能打开但无法对局：先确认服务端是否在运行。
- 教练按钮不显示：检查是否 `mode=local`、是否轮到人类玩家。
- 教练无 LLM 输出：检查 `COACH_USE_LLM`、API Key、超时配置。
- 音乐未播放：检查浏览器自动播放策略，先点击页面一次解锁音频。

