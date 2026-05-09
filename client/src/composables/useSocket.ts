import { io, Socket } from 'socket.io-client'
import { ref } from 'vue'
import { useGameStore } from '@/stores/game'
import type {
  CoachHintPayload,
  CoachHintStreamStartPayload,
  CoachHintStreamChunkPayload,
  CoachHintStreamEndPayload,
  CoachHintMode,
} from '@/types'
import { gameConfig } from '@game-config'
import { announceCardsPlayed, announcePlayerPassed } from '@/audio/play-announce'

let socket: Socket | null = null

export function useSocket() {
  const connected = ref(false)
  const store = useGameStore()

  function connect() {
    if (socket?.connected) return socket

    const raw = import.meta.env.VITE_SOCKET_URL as string | undefined
    /** 显式空字符串：与页面同源（Docker / Nginx 同端口部署） */
    const url =
      raw === ''
        ? undefined
        : raw !== undefined && raw !== ''
          ? raw
          : gameConfig.client.socketUrl
    const opts = { transports: ['websocket', 'polling'] as ('websocket' | 'polling')[] }
    socket = url === undefined ? io(opts) : io(url, opts)

    socket.on('connect', () => {
      connected.value = true
      console.log('Connected to server')
    })

    socket.on('disconnect', () => {
      connected.value = false
      store.resetAutoPlay()
      console.log('Disconnected from server')
    })

    socket.on('game-started', (state) => {
      store.setGameState(state)
    })

    socket.on('cards-played', ({ state }) => {
      store.setGameState(state)
      store.clearSelection()
      announceCardsPlayed(state)
    })

    socket.on('player-passed', ({ state }) => {
      store.setGameState(state)
      announcePlayerPassed(state)
    })

    socket.on('tribute-updated', ({ state }) => {
      store.setGameState(state)
      store.clearSelection()
    })

    socket.on('round-end', ({ state, message }) => {
      store.setGameState(state)
      store.addMessage({
        id: Date.now().toString(),
        playerId: 'system',
        playerName: '系统',
        content: message || '回合结束',
        type: 'system',
        timestamp: Date.now()
      })
    })

    socket.on('new-message', (msg) => {
      store.addMessage(msg)
    })

    socket.on('player-joined', ({ playerName }) => {
      store.addMessage({
        id: Date.now().toString(),
        playerId: 'system',
        playerName: '系统',
        content: `${playerName} 加入了房间`,
        type: 'system',
        timestamp: Date.now()
      })
    })

    socket.on('player-left', () => {
      store.addMessage({
        id: Date.now().toString(),
        playerId: 'system',
        playerName: '系统',
        content: '有玩家离开了房间',
        type: 'system',
        timestamp: Date.now()
      })
    })

    socket.on('coach-hint', (payload: CoachHintPayload) => {
      store.applyCoachHint(payload)
    })

    socket.on('coach-hint-start', (payload: CoachHintStreamStartPayload) => {
      store.applyCoachHintStart(payload)
    })

    socket.on('coach-hint-chunk', (payload: CoachHintStreamChunkPayload) => {
      store.appendCoachHintChunk(payload)
    })

    socket.on('coach-hint-end', (payload: CoachHintStreamEndPayload) => {
      store.applyCoachHintEnd(payload)
    })

    socket.on('auto-play-changed', ({ playerId, enabled }: { playerId: string; enabled: boolean }) => {
      if (playerId === store.playerId) {
        store.setAutoPlay(enabled)
      }
    })

    return socket
  }

  function createRoom(roomId: string, playerName: string, aiDifficulty: string, mode: 'local' | 'online' = 'online') {
    return new Promise<any>((resolve) => {
      socket?.emit('create-room', { roomId, playerName, aiDifficulty, mode }, (response: any) => {
        if (response.success) {
          store.setRoomInfo(roomId, playerName, response.playerId || socket?.id || '', mode)
          store.syncAutoPlayFromEntrustedIds(response.entrustedPlayerIds)
        }
        resolve(response)
      })
    })
  }

  function joinRoom(roomId: string, playerName: string) {
    return new Promise<any>((resolve) => {
      socket?.emit('join-room', { roomId, playerName }, (response: any) => {
        if (response.success) {
          store.setRoomInfo(roomId, playerName, response.playerId || socket?.id || '', 'online')
          store.setGameState(response.state)
          store.syncAutoPlayFromEntrustedIds(response.entrustedPlayerIds)
        }
        resolve(response)
      })
    })
  }

  function startGame(roomId: string) {
    return new Promise<any>((resolve) => {
      socket?.emit('start-game', { roomId }, (response: any) => {
        if (response.success) {
          store.setGameState(response.state)
        }
        resolve(response)
      })
    })
  }

  function playCards(roomId: string, cards: any[]) {
    return new Promise<any>((resolve) => {
      socket?.emit('play-cards', { roomId, cards }, (response: any) => {
        if (!response.success) {
          store.addMessage({
            id: Date.now().toString(),
            playerId: 'system',
            playerName: '系统',
            content: response.message || '出牌失败',
            type: 'system',
            timestamp: Date.now()
          })
        }
        resolve(response)
      })
    })
  }

  function pass(roomId: string) {
    return new Promise<any>((resolve) => {
      socket?.emit('pass', { roomId }, (response: any) => {
        if (!response.success) {
          store.addMessage({
            id: Date.now().toString(),
            playerId: 'system',
            playerName: '系统',
            content: response.message || '不出失败',
            type: 'system',
            timestamp: Date.now()
          })
        }
        resolve(response)
      })
    })
  }

  function submitTribute(roomId: string, cardId: string) {
    return new Promise<any>((resolve) => {
      socket?.emit('submit-tribute', { roomId, cardId }, (response: any) => {
        if (!response.success) {
          store.addMessage({
            id: Date.now().toString(),
            playerId: 'system',
            playerName: '系统',
            content: response.message || '进贡/还牌失败',
            type: 'system',
            timestamp: Date.now()
          })
        }
        resolve(response)
      })
    })
  }

  function requestCoachHint(roomId: string, coachMode: CoachHintMode = 'beginner') {
    const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    store.setCoachHintLoading(requestId, coachMode)
    socket?.emit('request-coach-hint', { roomId, requestId, coachMode }, () => {})
    return requestId
  }

  function sendMessage(roomId: string, message: string) {
    socket?.emit('send-message', { roomId, message })
  }

  function sendEmoji(roomId: string, emoji: string) {
    socket?.emit('send-emoji', { roomId, emoji })
  }

  function setAutoPlay(roomId: string, enabled: boolean) {
    return new Promise<any>((resolve) => {
      socket?.emit('set-auto-play', { roomId, enabled }, (response: any) => {
        if (!response?.success) {
          store.addMessage({
            id: Date.now().toString(),
            playerId: 'system',
            playerName: '系统',
            content: response?.message || '托管设置失败',
            type: 'system',
            timestamp: Date.now(),
          })
        }
        resolve(response)
      })
    })
  }

  function disconnect() {
    socket?.disconnect()
    socket = null
  }

  return {
    socket,
    connected,
    connect,
    createRoom,
    joinRoom,
    startGame,
    playCards,
    pass,
    submitTribute,
    requestCoachHint,
    sendMessage,
    sendEmoji,
    setAutoPlay,
    disconnect
  }
}
