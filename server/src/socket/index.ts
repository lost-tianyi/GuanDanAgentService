import { timingSafeEqual } from 'node:crypto'
import { Server as SocketServer } from 'socket.io'
import type { Server as HTTPServer } from 'http'
import { gameConfig } from '../config/game.js'
import { playStrength } from '../game/rules.js'
import { GuandanGame } from '../game/game.js'
import { BasicAI, type AIDifficulty } from '../ai/basic.js'
import { findLegalBeatingPlay, findMinimalLegalLead } from '../ai/legal-move-fallback.js'
import { CoachHintService } from '../coach/coach-hint-service.js'
import { ReasonEngine } from '../coach/reason-engine.js'
import type {
  BuildCoachHintInput,
  CoachHintPayload,
  CoachErrorCode,
  CoachHintMode,
  CoachHintStreamStartPayload,
  CoachHintStreamChunkPayload,
  CoachHintStreamEndPayload,
} from '../coach/types.js'

interface Room {
  game: GuandanGame
  sockets: Map<string, string>
  aiDifficulty: AIDifficulty
  mode: 'local' | 'online'
  /** 真人玩家 id：开启「托管」后由服务端按 AI 逻辑代打 */
  entrustedPlayers: Set<string>
}

const rooms = new Map<string, Room>()
const aiReasonEngine = new ReasonEngine()

/** 本连接是否已通过 COACH_UNLOCK_PASSWORD 校验（按 socket.id） */
const coachUnlockVerified = new Map<string, boolean>()

function timingSafeEqualUtf8(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8')
  const bufB = Buffer.from(b, 'utf8')
  if (bufA.length !== bufB.length) return false
  try {
    return timingSafeEqual(bufA, bufB)
  } catch {
    return false
  }
}

function buildHintInputForAi(room: Room, roomId: string, playerId: string): BuildCoachHintInput | null {
  const state = room.game.getState()
  const myIdx = state.players.findIndex((p) => p.id === playerId)
  if (myIdx < 0) return null
  return {
    roomId,
    handCards: state.players[myIdx].cards,
    lastPlayedPattern: state.lastPlayedPattern,
    playedHistory: state.playedCards.map((step) => ({
      position: step.position,
      cards: step.cards,
      pattern: step.pattern,
    })),
    context: {
      currentLevel: state.currentLevel,
      levelRank: state.levelRank,
      roundNumber: state.roundNumber,
      firstPlayerIndex: state.firstPlayerIndex,
      lastPlayerIndex: state.lastPlayerIndex,
      currentPlayerIndex: state.currentPlayerIndex,
      myPosition: myIdx,
      roundFinishOrder: [...state.roundFinishOrder],
      seats: state.players.map((p, i) => ({
        position: i,
        name: p.name,
        remainingCards: p.cards.length,
        isAI: p.isAI,
      })),
    },
    coachMode: 'expert',
  }
}

export function setupSocket(io: HTTPServer) {
  const socketServer = new SocketServer(io, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  })

  socketServer.on('connection', (socket) => {
    console.log(`客户端连接: ${socket.id}`)

    const coachPwdRequired = gameConfig.server.coachUnlockPassword.length > 0
    coachUnlockVerified.delete(socket.id)
    socket.emit('coach-gate', { required: coachPwdRequired })

    socket.on('unlock-coach', (payload: { password?: string }, callback) => {
      const expected = gameConfig.server.coachUnlockPassword
      if (!expected) {
        coachUnlockVerified.set(socket.id, true)
        callback?.({ ok: true as const })
        return
      }
      const input = typeof payload?.password === 'string' ? payload.password : ''
      if (timingSafeEqualUtf8(input, expected)) {
        coachUnlockVerified.set(socket.id, true)
        callback?.({ ok: true as const })
      } else {
        callback?.({ ok: false as const, errorMessage: '密码错误' })
      }
    })

    socket.on('create-room', ({ roomId, playerName, aiDifficulty, mode }, callback) => {
      if (rooms.has(roomId)) {
        callback({ success: false, message: '房间已存在' })
        return
      }

      const game = new GuandanGame(roomId)
      const room: Room = {
        game,
        sockets: new Map(),
        aiDifficulty: aiDifficulty || 'normal',
        mode: mode === 'online' ? 'online' : 'local',
        entrustedPlayers: new Set(),
      }

      game.addPlayer(socket.id, playerName, false)
      room.sockets.set(socket.id, playerName)

      socket.join(roomId)
      rooms.set(roomId, room)

      callback({ success: true, roomId, playerId: socket.id, entrustedPlayerIds: [] })
      console.log(`房间创建: ${roomId}`)
    })

    socket.on('join-room', ({ roomId, playerName }, callback) => {
      const room = rooms.get(roomId)
      if (!room) {
        callback({ success: false, message: '房间不存在' })
        return
      }

      if (room.sockets.size >= 4) {
        callback({ success: false, message: '房间已满' })
        return
      }

      room.game.addPlayer(socket.id, playerName, false)
      room.sockets.set(socket.id, playerName)

      socket.join(roomId)

      const state = room.game.getState()
      socketServer.to(roomId).emit('player-joined', { playerId: socket.id, playerName })

      callback({
        success: true,
        roomId,
        state,
        playerId: socket.id,
        entrustedPlayerIds: [...room.entrustedPlayers],
      })
      console.log(`玩家加入: ${playerName} 加入房间 ${roomId}`)
    })

    socket.on('set-auto-play', ({ roomId, enabled }: { roomId: string; enabled: boolean }, callback) => {
      const respond = (payload: Record<string, unknown>) => {
        callback?.(payload)
      }
      const room = rooms.get(roomId)
      if (!room) {
        respond({ success: false, message: '房间不存在' })
        return
      }
      const player = room.game.getState().players.find((p) => p.id === socket.id)
      if (!player) {
        respond({ success: false, message: '你不在此房间' })
        return
      }
      if (player.isAI) {
        respond({ success: false, message: 'AI 无需托管' })
        return
      }

      if (enabled) {
        room.entrustedPlayers.add(socket.id)
      } else {
        room.entrustedPlayers.delete(socket.id)
      }

      socketServer.to(roomId).emit('auto-play-changed', { playerId: socket.id, enabled })
      respond({ success: true, enabled })

      triggerBotTurnIfNeeded(room, roomId, socketServer)
    })

    socket.on('start-game', ({ roomId }, callback) => {
      const room = rooms.get(roomId)
      if (!room) {
        callback({ success: false, message: '房间不存在' })
        return
      }

      const playerCount = room.game.getState().players.length
      const aiNeeded = 4 - playerCount

      for (let i = 0; i < aiNeeded; i++) {
        const aiId = `ai-${Date.now()}-${i}`
        room.game.addPlayer(aiId, `AI ${i + 1}`, true)
      }

      room.game.startGame()
      const state = room.game.getState()

      socketServer.to(roomId).emit('game-started', state)
      callback({ success: true, state })

      scheduleHandleAITurnAfterHuman(roomId, socketServer)
      console.log(`游戏开始: ${roomId}`)
    })

    socket.on('play-cards', ({ roomId, cards }, callback) => {
      const room = rooms.get(roomId)
      if (!room) {
        callback({ success: false, message: '房间不存在' })
        return
      }

      const result = room.game.playCards(socket.id, cards)

      if (result.success) {
        const state = room.game.getState()
        socketServer.to(roomId).emit('cards-played', { 
          playerId: socket.id, 
          cards, 
          state 
        })

        if (result.roundFinished) {
          socketServer.to(roomId).emit('round-end', { 
            state, 
            message: result.message 
          })
        }

        scheduleHandleAITurnAfterHuman(roomId, socketServer)
      }

      callback(result)
    })

    socket.on('pass', ({ roomId }, callback) => {
      const room = rooms.get(roomId)
      if (!room) {
        callback({ success: false, message: '房间不存在' })
        return
      }

      const result = room.game.pass(socket.id)

      if (result.success) {
        const state = room.game.getState()
        socketServer.to(roomId).emit('player-passed', { playerId: socket.id, state })

        scheduleHandleAITurnAfterHuman(roomId, socketServer)
      }

      callback(result)
    })

    socket.on('submit-tribute', ({ roomId, cardId }, callback) => {
      const room = rooms.get(roomId)
      if (!room) {
        callback?.({ success: false, message: '房间不存在' })
        return
      }

      const result = room.game.submitTributeAction(socket.id, cardId)

      if (result.success) {
        const state = room.game.getState()
        socketServer.to(roomId).emit('tribute-updated', { state })
        scheduleHandleAITurnAfterHuman(roomId, socketServer)
      }

      callback?.(result)
    })

    socket.on('send-message', ({ roomId, message }, callback) => {
      const room = rooms.get(roomId)
      if (!room) {
        callback?.({ success: false })
        return
      }

      const player = room.game.getPlayer(socket.id)
      socketServer.to(roomId).emit('new-message', {
        playerId: socket.id,
        playerName: player?.name || '未知',
        content: message,
        type: 'text'
      })

      callback?.({ success: true })
    })

    socket.on('send-emoji', ({ roomId, emoji }, callback) => {
      const room = rooms.get(roomId)
      if (!room) {
        callback?.({ success: false })
        return
      }

      const player = room.game.getPlayer(socket.id)
      socketServer.to(roomId).emit('new-message', {
        playerId: socket.id,
        playerName: player?.name || '未知',
        content: emoji,
        type: 'emoji'
      })

      callback?.({ success: true })
    })

    socket.on('request-coach-hint', async (payload: { roomId?: string; requestId?: string; coachMode?: string }, callback) => {
      const { roomId: rawRoomId, requestId, coachMode: rawMode } = payload || {}
      const reqId = typeof requestId === 'string' && requestId ? requestId : `${Date.now()}`
      const coachMode: CoachHintMode = rawMode === 'expert' ? 'expert' : 'beginner'
      const roomId = typeof rawRoomId === 'string' ? rawRoomId : ''
      const room = roomId ? rooms.get(roomId) : undefined

      console.log('[coach] request-coach-hint', {
        socketId: socket.id,
        roomId: roomId || '(empty)',
        coachMode,
        reqId,
        roomFound: !!room,
        knownRooms: rooms.size,
      })

      const respondError = (errorCode: CoachErrorCode, errorMessage: string) => {
        console.warn('[coach] reject →', errorCode, errorMessage)
        const payload: CoachHintPayload = {
          ok: false,
          roomId: roomId || '',
          requestId: reqId,
          errorCode,
          errorMessage,
        }
        socket.emit('coach-hint', payload)
        callback?.({ success: false, errorCode, errorMessage })
      }

      if (!roomId || !room) {
        respondError('COACH_ROOM_NOT_FOUND', '房间不存在')
        return
      }

      if (room.mode !== 'local') {
        respondError('COACH_NOT_AVAILABLE_MODE', '当前模式不支持教练提示')
        return
      }

      const state = room.game.getState()
      const currentPlayer = state.players[state.currentPlayerIndex]
      if (!currentPlayer || currentPlayer.id !== socket.id) {
        respondError('COACH_NOT_YOUR_TURN', '未轮到你出牌')
        return
      }
      if (currentPlayer.isAI) {
        respondError('COACH_REQUEST_PLAYER_IS_AI', 'AI 玩家无需教练提示')
        return
      }

      if (state.status === 'tribute') {
        respondError('COACH_NOT_YOUR_TURN', '进贡阶段不可用教练提示')
        return
      }

      if (!gameConfig.server.coachHintEnabled) {
        respondError('COACH_HINT_DISABLED', '教练提示已关闭')
        return
      }

      if (gameConfig.server.coachUnlockPassword.length > 0 && !coachUnlockVerified.get(socket.id)) {
        respondError('COACH_UNLOCK_REQUIRED', '请先输入密码解锁教练提示')
        return
      }

      const s = gameConfig.server
      console.log('[coach] generating…', {
        reqId,
        coachUseLlm: s.coachUseLlm,
        coachUseStream: s.coachUseStream,
        hasOpenAiKey: s.openAiApiKey.length > 0,
      })

      try {
        const myIdx = state.players.findIndex((p) => p.id === socket.id)
        const service = new CoachHintService(room.game)
        const hintInput = {
          roomId,
          handCards: currentPlayer.cards,
          lastPlayedPattern: state.lastPlayedPattern,
          playedHistory: state.playedCards.map((step) => ({
            position: step.position,
            cards: step.cards,
            pattern: step.pattern,
          })),
          context: {
            currentLevel: state.currentLevel,
            levelRank: state.levelRank,
            roundNumber: state.roundNumber,
            firstPlayerIndex: state.firstPlayerIndex,
            lastPlayerIndex: state.lastPlayerIndex,
            currentPlayerIndex: state.currentPlayerIndex,
            myPosition: myIdx >= 0 ? myIdx : state.currentPlayerIndex,
            roundFinishOrder: [...state.roundFinishOrder],
            seats: state.players.map((p, i) => ({
              position: i,
              name: p.name,
              remainingCards: p.cards.length,
              isAI: p.isAI,
            })),
          },
          coachMode,
        }

        const result = await service.buildCoachHintStream(hintInput, {
          onRecommendation: (recommended) => {
            const startPayload: CoachHintStreamStartPayload = {
              roomId,
              requestId: reqId,
              recommended,
              coachMode,
            }
            socket.emit('coach-hint-start', startPayload)
          },
          onReasonDelta: (text) => {
            if (!text) return
            const chunkPayload: CoachHintStreamChunkPayload = { roomId, requestId: reqId, text }
            socket.emit('coach-hint-chunk', chunkPayload)
          },
        })

        const endPayload: CoachHintStreamEndPayload = {
          ok: true,
          roomId,
          requestId: reqId,
          reason: result.reason,
          confidence: result.confidence,
        }
        socket.emit('coach-hint-end', endPayload)

        console.log('[coach] done', {
          reqId,
          reasonLen: result.reason?.length ?? 0,
          confidence: result.confidence,
        })
        callback?.({ success: true })
      } catch (error) {
        console.error('[coach] exception', error)
        respondError('COACH_INTERNAL_ERROR', '教练提示生成失败')
      }
    })

    socket.on('disconnect', () => {
      console.log(`客户端断开: ${socket.id}`)
      coachUnlockVerified.delete(socket.id)

      for (const [roomId, room] of rooms) {
        if (room.sockets.has(socket.id)) {
          room.entrustedPlayers.delete(socket.id)
          room.game.removePlayer(socket.id)
          room.sockets.delete(socket.id)

          socketServer.to(roomId).emit('player-left', { playerId: socket.id })

          if (room.sockets.size === 0) {
            rooms.delete(roomId)
            console.log(`房间关闭: ${roomId}`)
          }
          break
        }
      }
    })
  })

  return socketServer
}

function triggerBotTurnIfNeeded(room: Room, roomId: string, io: SocketServer) {
  const state = room.game.getState()
  if (state.status === 'playing') {
    const p = state.players[state.currentPlayerIndex]
    if (p && !p.isAI && room.entrustedPlayers.has(p.id)) {
      void handleAITurn(roomId, io)
    }
    return
  }
  if (state.status === 'tribute') {
    const step = room.game.getCurrentTributeStep()
    if (!step) return
    const p = state.players[step.from]
    if (p && !p.isAI && room.entrustedPlayers.has(p.id)) {
      void handleAITurn(roomId, io)
    }
  }
}

function shouldAiActNext(room: Room): boolean {
  const state = room.game.getState()
  if (state.status === 'tribute') {
    const step = room.game.getCurrentTributeStep()
    if (!step) return false
    const p = state.players[step.from]
    return Boolean(p && (p.isAI || room.entrustedPlayers.has(p.id)))
  }
  if (state.status !== 'playing') return false
  const p = state.players[state.currentPlayerIndex]
  return Boolean(p && (p.isAI || room.entrustedPlayers.has(p.id)))
}

/** 人类出牌/过/进贡提交等广播后：若下一步轮到 AI，则延迟再驱动，便于客户端语音播完 */
function scheduleHandleAITurnAfterHuman(roomId: string, io: SocketServer) {
  const room = rooms.get(roomId)
  if (!room) return
  if (!shouldAiActNext(room)) return

  setTimeout(
    () => void handleAITurn(roomId, io),
    gameConfig.server.aiRespondDelayAfterHumanMs,
  )
}

async function handleAITurn(roomId: string, io: SocketServer) {
  const room = rooms.get(roomId)
  if (!room) return

  const state = room.game.getState()
  if (state.status === 'game_over' || state.status === 'waiting') return

  if (state.status === 'tribute') {
    const runTribute = () => {
      const st = room.game.getState()
      if (st.status !== 'tribute') {
        handleAITurn(roomId, io)
        return
      }
      const step = room.game.getCurrentTributeStep()
      if (!step) {
        handleAITurn(roomId, io)
        return
      }
      const actor = st.players[step.from]
      const allowAuto = actor.isAI || room.entrustedPlayers.has(actor.id)
      if (!allowAuto) return
      room.game.autoAdvanceTributeStep(actor.isAI ? undefined : actor.id)
      const newState = room.game.getState()
      io.to(roomId).emit('tribute-updated', { state: newState })
      setTimeout(runTribute, gameConfig.server.tributeStepDelayMs)
    }
    runTribute()
    return
  }

  if (state.status !== 'playing') return

  const currentPlayer = state.players[state.currentPlayerIndex]
  if (!currentPlayer) return
  if (!currentPlayer.isAI && !room.entrustedPlayers.has(currentPlayer.id)) return

  await executeAiPlayTurn(room, roomId, io)
}

/**
 * AI 出牌：BasicAI → 规则穷举 →（可选）与教练同源的大模型校验出牌 → 末档领出最小单张。
 * 仅在 playCards/pass 成功时广播，避免状态与 UI 卡在「出牌中」。
 */
async function executeAiPlayTurn(room: Room, roomId: string, io: SocketServer) {
  const game = room.game
  let st = game.getState()
  const turnIndex = st.currentPlayerIndex
  const current = st.players[turnIndex]
  if (!current) return
  if (!current.isAI && !room.entrustedPlayers.has(current.id)) return

  const playerId = current.id

  const stillAutomated = () => {
    const s = game.getState()
    const pl = s.players[turnIndex]
    return Boolean(pl?.id === playerId && (pl.isAI || room.entrustedPlayers.has(playerId)))
  }

  const ctx = game.getJudgeContext()
  const lastPattern = st.lastPlayedPattern
  const lastPlayerIndex = st.lastPlayerIndex

  const scheduleNextPlay = () => {
    setTimeout(() => void handleAITurn(roomId, io), gameConfig.server.aiPlayDelayMs)
  }
  const scheduleNextPass = () => {
    setTimeout(() => void handleAITurn(roomId, io), gameConfig.server.aiPassDelayMs)
  }

  const emitCardsPlayed = (cards: typeof current.cards, result: { roundFinished?: boolean; message?: string }) => {
    const newState = game.getState()
    io.to(roomId).emit('cards-played', {
      playerId,
      cards,
      state: newState,
    })
    if (result.roundFinished) {
      io.to(roomId).emit('round-end', {
        state: newState,
        message: result.message,
      })
    }
    scheduleNextPlay()
  }

  const emitPassed = () => {
    const newState = game.getState()
    io.to(roomId).emit('player-passed', { playerId, state: newState })
    scheduleNextPass()
  }

  const tryPlay = (cards: typeof current.cards) => {
    if (cards.length === 0) return { success: false as const, message: 'empty' }
    return game.playCards(playerId, cards)
  }

  const ai = new BasicAI(game, room.aiDifficulty)
  let chosen = ai.selectCards(current.cards, lastPattern)

  if (chosen.length === 0) {
    const passRes = game.pass(playerId)
    if (passRes.success) {
      emitPassed()
      return
    }
    console.warn('[ai] BasicAI 选择不出但 pass 失败，进入兜底:', passRes.message)
  } else {
    const playRes = tryPlay(chosen)
    if (playRes.success) {
      emitCardsPlayed(chosen, playRes)
      return
    }
    console.warn('[ai] BasicAI 出牌未通过规则校验，进入兜底:', playRes.message)
  }

  const hand = game.getState().players[turnIndex]?.cards ?? current.cards

  if (lastPattern && lastPlayerIndex !== -1) {
    const beat = findLegalBeatingPlay(hand, lastPattern, ctx)
    if (beat) {
      const r = tryPlay(beat)
      if (r.success) {
        emitCardsPlayed(beat, r)
        return
      }
    }
    const passRes = game.pass(playerId)
    if (passRes.success) {
      emitPassed()
      return
    }
    console.warn('[ai] 跟牌穷举后仍无法 pass:', passRes.message)
  } else {
    const lead = findMinimalLegalLead(hand, ctx)
    if (lead) {
      const r = tryPlay(lead)
      if (r.success) {
        emitCardsPlayed(lead, r)
        return
      }
    }
  }

  const hint = buildHintInputForAi(room, roomId, playerId)
  if (hint) {
    st = game.getState()
    if (st.currentPlayerIndex !== turnIndex || st.players[turnIndex]?.id !== playerId) {
      console.warn('[ai] 回合已切换，跳过 LLM 兜底')
      return
    }

    if (!stillAutomated()) return

    const llm = await aiReasonEngine.fetchLlmValidatedPlay(hint, ctx)
    st = game.getState()
    if (st.currentPlayerIndex !== turnIndex || st.players[turnIndex]?.id !== playerId) {
      console.warn('[ai] LLM 返回后回合已切换')
      return
    }

    if (!stillAutomated()) return

    const handAfter = st.players[turnIndex].cards

    if (llm?.action === 'pass' && lastPlayerIndex !== -1) {
      const pr = game.pass(playerId)
      if (pr.success) {
        emitPassed()
        return
      }
    }
    if (llm?.action === 'play' && llm.cards.length > 0) {
      const r = tryPlay(llm.cards)
      if (r.success) {
        emitCardsPlayed(llm.cards, r)
        return
      }
    }
  }

  st = game.getState()
  if (st.currentPlayerIndex === turnIndex && st.players[turnIndex]?.id === playerId) {
    if (!lastPattern || lastPlayerIndex === -1) {
      const lr = st.levelRank
      const sorted = [...st.players[turnIndex].cards].sort(
        (a, b) => playStrength(a, lr) - playStrength(b, lr),
      )
      const c0 = sorted[0]
      if (c0) {
        const r = tryPlay([c0])
        if (r.success) {
          emitCardsPlayed([c0], r)
          return
        }
      }
    }
  }

  console.error('[ai] 全部兜底失败，尝试强制 pass（跟牌场景）')
  if (lastPlayerIndex !== -1) {
    const pr = game.pass(playerId)
    if (pr.success) {
      emitPassed()
    }
  }
}
