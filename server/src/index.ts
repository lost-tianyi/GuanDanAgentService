import './load-env.js'

import express from 'express'
import { createServer } from 'http'
import cors from 'cors'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { gameConfig } from './config/game.js'
import { setupSocket } from './socket/index.js'

const app = express()
const httpServer = createServer(app)

app.use(cors())
app.use(express.json())

app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const clientDist = process.env.CLIENT_DIST_PATH
  ? path.resolve(process.env.CLIENT_DIST_PATH)
  : path.join(__dirname, '..', '..', 'client', 'dist')

if (fs.existsSync(clientDist) && fs.existsSync(path.join(clientDist, 'index.html'))) {
  app.use(express.static(clientDist))
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/socket.io')) return next()
    res.sendFile(path.join(clientDist, 'index.html'))
  })
}

const PORT = gameConfig.server.httpPort

setupSocket(httpServer)

function onListen() {
  const s = gameConfig.server
  const where = process.env.NODE_ENV === 'production' ? `0.0.0.0:${PORT}` : `localhost:${PORT}`
  console.log(`服务器运行在 http://${where}`)
  console.log('[coach] 配置:', {
    coachHintEnabled: s.coachHintEnabled,
    coachUseLlm: s.coachUseLlm,
    coachUseStream: s.coachUseStream,
    hasOpenAiKey: s.openAiApiKey.length > 0,
    openAiApiBase: s.openAiApiBase,
    model: s.coachLlmModel,
    coachReasonTimeoutMs: s.coachReasonTimeoutMs,
  })
}

if (process.env.NODE_ENV === 'production') {
  httpServer.listen(PORT, '0.0.0.0', onListen)
} else {
  httpServer.listen(PORT, onListen)
}
