import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import * as api from '../utils/api'

interface Player {
  id: string
  name: string
  score: number
}

interface GameState {
  id: string
  roomId: string
  players: Player[]
  currentRound: number
  maxRounds: number
  currentWord: string | null
  phase: 'LOBBY' | 'PROMPT' | 'VOTING' | 'RESULTS'
  images: any[]
  votes: any[]
}

interface GameContextType {
  gameState: GameState | null
  roomId: string | null
  playerId: string | null
  playerName: string | null
  createOrJoinGame: (roomId: string, playerName: string) => Promise<void>
  startGame: () => Promise<void>
  startNextRound: () => Promise<void>
  submitPrompt: (prompt: string) => Promise<void>
  submitVote: (imageId: string) => Promise<void>
  refreshGame: () => Promise<void>
}

const GameContext = createContext<GameContextType | undefined>(undefined)

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [roomId, setRoomId] = useState<string | null>(() => localStorage.getItem('roomId'))
  const [playerId, setPlayerId] = useState<string | null>(() => localStorage.getItem('playerId'))
  const [playerName, setPlayerName] = useState<string | null>(() => localStorage.getItem('playerName'))

  // Fetch game state from backend
  const refreshGame = async () => {
    if (!roomId) return
    const game = await api.getGame(roomId)
    setGameState(game)
  }

  // Create or join a game
  const createOrJoinGame = async (roomIdInput: string, playerNameInput: string) => {
    let game
    try {
      game = await api.createGame(roomIdInput)
    } catch {
      // If game already exists, just fetch it
      game = await api.getGame(roomIdInput)
    }
    setRoomId(roomIdInput)
    localStorage.setItem('roomId', roomIdInput)
    // Add player
    const player = await api.addPlayer(roomIdInput, playerNameInput)
    setPlayerId(player.id)
    setPlayerName(player.name)
    localStorage.setItem('playerId', player.id)
    localStorage.setItem('playerName', player.name)
    setGameState(game)
    await refreshGame()
  }

  const startGame = async () => {
    if (!roomId) return
    await api.startGame(roomId)
    await refreshGame()
  }

  const startNextRound = async () => {
    if (!roomId) return
    await api.nextRound(roomId)
    await refreshGame()
  }

  const submitPrompt = async (prompt: string) => {
    if (!roomId || !playerId) return
    try {
      const updatedGame = await api.generateImage(prompt, roomId, playerId)
      setGameState(updatedGame)
    } catch (error) {
      console.error('Error submitting prompt:', error)
      // Optionally show an error message to the user
    }
  }

  const submitVote = async (imageId: string) => {
    if (!roomId || !playerId) return
    await api.vote(roomId, imageId, playerId)
    await refreshGame()
  }

  useEffect(() => {
    if (roomId) {
      refreshGame()
    }
    // eslint-disable-next-line
  }, [roomId])

  return (
    <GameContext.Provider
      value={{
        gameState,
        roomId,
        playerId,
        playerName,
        createOrJoinGame,
        startGame,
        startNextRound,
        submitPrompt,
        submitVote,
        refreshGame,
      }}
    >
      {children}
    </GameContext.Provider>
  )
}

export const useGame = () => {
  const context = useContext(GameContext)
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider')
  }
  return context
} 