import React, { createContext, useContext, useState, ReactNode } from 'react'
import { gameWords, WordData } from '../data/words'
import { generateImage } from '../utils/api'

interface Player {
  id: string
  name: string
  score: number
}

interface GameState {
  roomId: string
  players: Player[]
  currentRound: number
  maxRounds: number
  currentWord: WordData | null
  phase: 'lobby' | 'prompt' | 'voting' | 'results'
  images: string[]
  votes: Record<string, number>
}

interface GameContextType {
  gameState: GameState
  addPlayer: (name: string) => void
  removePlayer: (id: string) => void
  startGame: () => void
  startNextRound: () => void
  submitPrompt: (prompt: string) => void
  submitVote: (imageIndex: number) => void
  endGame: () => void
}

const GameContext = createContext<GameContextType | undefined>(undefined)

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [gameState, setGameState] = useState<GameState>({
    roomId: '',
    players: [],
    currentRound: 0,
    maxRounds: 5,
    currentWord: null,
    phase: 'lobby',
    images: [],
    votes: {},
  })

  const addPlayer = (name: string) => {
    setGameState(prev => ({
      ...prev,
      players: [...prev.players, { id: Math.random().toString(), name, score: 0 }]
    }))
  }

  const removePlayer = (id: string) => {
    setGameState(prev => ({
      ...prev,
      players: prev.players.filter(player => player.id !== id)
    }))
  }

  const startGame = () => {
    const randomWord = gameWords[Math.floor(Math.random() * gameWords.length)]
    setGameState(prev => ({
      ...prev,
      currentRound: 1,
      currentWord: randomWord,
      phase: 'prompt'
    }))
  }

  const startNextRound = () => {
    if (gameState.currentRound >= gameState.maxRounds) {
      endGame()
      return
    }

    const randomWord = gameWords[Math.floor(Math.random() * gameWords.length)]
    setGameState(prev => ({
      ...prev,
      currentRound: prev.currentRound + 1,
      currentWord: randomWord,
      phase: 'prompt',
      images: [],
      votes: {}
    }))
  }

  const submitPrompt = async (prompt: string) => {
    try {
      const imageUrl = await generateImage(prompt)
      setGameState(prev => ({
        ...prev,
        images: [...prev.images, imageUrl],
        phase: 'voting'
      }))
    } catch (error) {
      console.error('Error generating image:', error)
      // Handle error appropriately
    }
  }

  const submitVote = (imageIndex: number) => {
    const newVotes = { ...gameState.votes }
    newVotes[imageIndex] = (newVotes[imageIndex] || 0) + 1

    // Check if all players have voted
    if (Object.keys(newVotes).length === gameState.players.length - 1) {
      // Find winner and update scores
      const winnerIndex = Object.entries(newVotes).reduce((a, b) => 
        (b[1] > (newVotes[a] || 0)) ? parseInt(b[0]) : a, 0
      )

      const updatedPlayers = gameState.players.map((player, index) => 
        index === winnerIndex
          ? { ...player, score: player.score + 1 }
          : player
      )

      setGameState(prev => ({
        ...prev,
        players: updatedPlayers,
        votes: newVotes,
        phase: 'results'
      }))
    } else {
      setGameState(prev => ({
        ...prev,
        votes: newVotes
      }))
    }
  }

  const endGame = () => {
    setGameState(prev => ({
      ...prev,
      phase: 'results'
    }))
  }

  return (
    <GameContext.Provider
      value={{
        gameState,
        addPlayer,
        removePlayer,
        startGame,
        startNextRound,
        submitPrompt,
        submitVote,
        endGame,
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