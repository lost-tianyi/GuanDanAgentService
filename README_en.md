# Guandan Project Guide (English)

## 1) Overview
Guandan is a full-stack card game project with:
- `client`: Vue 3 + Vite frontend (UI, hand interaction, room/game flow, Socket client).
- `server`: Node.js + TypeScript + Socket.IO backend (rules, turn engine, AI play, coach hints).

Based on the current PRD/HLD/LLD (`guandan-coach-v1` docs), V1 focuses on:
- Local PvE mode (`mode=local`).
- Guandan Coach: recommended move + reasoning.
- Coach feature is not enabled for online PvP (`mode=online`) in V1.

## 1.1) OpenSpec

This repo uses [OpenSpec](https://openspec.dev): capability specs live under `openspec/specs/` and change proposals under `openspec/changes/`. After `npm install` at the repo root, run `npm run openspec -- --help`. Cursor slash commands are under `.cursor/commands/` (restart IDE after setup). See `openspec/README.md`.

## 2) Key Features
- Rule engine on server side (`analyzePattern`, `canBeat`, etc.).
- Turn orchestration (play/pass, trick transitions, tribute flow).
- AI play:
  - Rule-based AI (`BasicAI`) first.
  - Fallback path can use LLM suggestions when rule logic cannot finalize a move (depends on server config).
- Coach feature (V1):
  - Available only in local mode and only on the human player's turn.
  - Returns `recommended + reason`; falls back to template explanation when LLM fails.

## 3) Product/Design Docs
- PRD: `docs/PRD-guandan-coach-v1.md`
- HLD: `docs/HLD-guandan-coach-v1.md`
- LLD: `docs/LLD-guandan-coach-v1.md`

## 4) Requirements
- Node.js 18+ (20+ recommended)
- npm 9+

## 5) Install Dependencies
Install dependencies in both subprojects:

```bash
cd guandan/client
npm install

cd ../server
npm install
```

## 6) Run in Development
Run client and server in two terminals.

### 6.1 Start Server
```bash
cd guandan/server
npm run dev
```

### 6.2 Start Client
```bash
cd guandan/client
npm run dev
```

Then open the Vite URL from terminal output (usually `http://localhost:5173`).

## 7) Common Commands

### 7.1 Client
```bash
cd guandan/client
npm run dev            # local development
npm run build          # production build (includes vue-tsc)
npm run preview        # preview built assets
npx vue-tsc --noEmit   # type check
```

### 7.2 Server
```bash
cd guandan/server
npm run dev            # dev with watch (tsx)
npm run build          # compile TS to dist
npm run start          # run dist server
npx tsc --noEmit       # type check
```

## 8) Docker Deployment

The repo root includes a **`Dockerfile`** and **`docker-compose.yml`**: one container serves the built Vue app (`client/dist`), Socket.IO, and `GET /health` on port **3001** by default. The client is built with an empty **`VITE_SOCKET_URL`**, so the Socket.IO client connects to the **same origin** as the page (good for single-port hosting).

**Build** (from repo root):

```bash
docker build -t guandan:latest .
```

If the browser and Socket endpoint use different origins, set at build time:

```bash
docker build --build-arg VITE_SOCKET_URL=https://api.example.com -t guandan:latest .
```

**Run** (mount `server/.env` read-only; never bake secrets into the image):

```bash
docker run -d --name guandan -p 3001:3001 \
  -v "$(pwd)/server/.env:/app/server/.env:ro" \
  guandan:latest
```

Open `http://<host>:3001`. Health: `GET /health`.

**Compose:** `docker compose up --build -d` — optionally add a volume for `./server/.env` as in `README.zh-CN.md` section 8.

Runtime env: see `server/.env.example` and `server/src/config/env.ts` (`PORT`, `CLIENT_DIST_PATH`, LLM keys, etc.).

## 9) Configuration (Summary)
Common server flags (see `server/src/config/env.ts`):
- `COACH_HINT_ENABLED`: enable/disable coach.
- `COACH_USE_LLM`: enable/disable LLM reasoning/recommendation.
- `COACH_REASON_TIMEOUT_MS`: coach request timeout.
- `OPENAI_API_KEY` (or provider-specific key): LLM credential.

BGM (this audio directory):
- Default local file: `client/public/audio/bgm.mp3`
- Optional override: `VITE_BGM_URL` for remote mp3 URL.

## 10) Quick Troubleshooting
- UI opens but game does not progress: ensure server is running.
- Coach button missing: check `mode=local` and verify it is the human player's turn.
- Coach has no LLM output: verify `COACH_USE_LLM`, API key, and timeout.
- Music not playing: browser autoplay policy requires a first user interaction.

