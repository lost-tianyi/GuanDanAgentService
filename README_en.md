# Guandan Project Guide (English)

## 1) Overview
Guandan is a full-stack card game project with:
- `client`: Vue 3 + Vite frontend (UI, hand interaction, room/game flow, Socket client).
- `server`: Node.js + TypeScript + Socket.IO backend (rules, turn engine, AI play, coach hints).

Based on the current PRD/HLD/LLD (`guandan-coach-v1` docs), V1 focuses on:
- Local PvE mode (`mode=local`).
- Guandan Coach: recommended move + reasoning.
- Coach feature is not enabled for online PvP (`mode=online`) in V1.

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

## 8) Configuration (Summary)
Common server flags (see `server/src/config/env.ts`):
- `COACH_HINT_ENABLED`: enable/disable coach.
- `COACH_USE_LLM`: enable/disable LLM reasoning/recommendation.
- `COACH_REASON_TIMEOUT_MS`: coach request timeout.
- `OPENAI_API_KEY` (or provider-specific key): LLM credential.

BGM (this audio directory):
- Default local file: `client/public/audio/bgm.mp3`
- Optional override: `VITE_BGM_URL` for remote mp3 URL.

## 9) Quick Troubleshooting
- UI opens but game does not progress: ensure server is running.
- Coach button missing: check `mode=local` and verify it is the human player's turn.
- Coach has no LLM output: verify `COACH_USE_LLM`, API key, and timeout.
- Music not playing: browser autoplay policy requires a first user interaction.

