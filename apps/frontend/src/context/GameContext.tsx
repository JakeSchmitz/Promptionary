import React, { createContext, useContext, useState, useEffect } from 'react'

// Remove the /api suffix from the fallback since it's now in the env var
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
console.log('API_URL:', API_URL)

interface Player {
  id: string
  name: string
  score: number
}

interface Submission {
  id: string
  playerId: string
  prompt: string
  imageUrl: string
  votes: string[]
}

interface Round {
  targetWord: string
  submissions: Submission[]
  isComplete: boolean
}

interface GameState {
  id: string
  roomId: string
  players: Player[]
  currentRound: number
  totalRounds: number
  rounds: Round[]
  isComplete: boolean
  phase: 'LOBBY' | 'PROMPT' | 'VOTING' | 'RESULTS'
}

interface GameContextType {
  gameState: GameState | null
  currentPlayer: Player | null
  submitPrompt: (prompt: string) => Promise<void>
  submitVote: (submissionId: string) => Promise<void>
  startNewRound: () => Promise<void>
  createGame: () => Promise<string>
  refreshGameState: () => Promise<void>
  startGame: () => Promise<void>
}

export const GameContext = createContext<GameContextType>({
  gameState: null,
  currentPlayer: null,
  submitPrompt: async () => {},
  submitVote: async () => {},
  startNewRound: async () => {},
  createGame: async () => '',
  refreshGameState: async () => {},
  startGame: async () => {},
})

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null)

  // Initialize game state from localStorage or create new game
  useEffect(() => {
    const savedGame = localStorage.getItem('gameState')
    const savedPlayer = localStorage.getItem('user')
    
    if (savedGame && savedPlayer) {
      const parsedGame = JSON.parse(savedGame)
      setGameState(parsedGame)
      setCurrentPlayer({
        id: savedPlayer,
        name: savedPlayer,
        score: 0
      })

      // Fetch the latest game state from the server
      const fetchLatestState = async () => {
        try {
          console.log('Fetching latest game state for room:', parsedGame.roomId)
          const response = await fetch(`${API_URL}/games/${parsedGame.roomId}`)
          if (response.ok) {
            const data = await response.json()
            console.log('Latest game state:', data)
            setGameState(data)
          } else {
            console.error('Failed to fetch latest game state')
          }
        } catch (error) {
          console.error('Error fetching latest game state:', error)
        }
      }

      fetchLatestState()
    }
  }, [])

  // Save game state to localStorage whenever it changes
  useEffect(() => {
    if (gameState) {
      localStorage.setItem('gameState', JSON.stringify(gameState))
    }
  }, [gameState])

  const submitPrompt = async (prompt: string) => {
    if (!gameState || !currentPlayer) return

    try {
      const response = await fetch(`${API_URL}/games/${gameState.id}/prompts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerId: currentPlayer.id,
          prompt,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit prompt')
      }

      const data = await response.json()
      const newSubmission: Submission = {
        id: data.id,
        playerId: currentPlayer.id,
        prompt,
        imageUrl: data.imageUrl,
        votes: [],
      }

      const updatedRounds = [...gameState.rounds]
      const currentRoundIndex = gameState.currentRound
      if (!updatedRounds[currentRoundIndex]) {
        updatedRounds[currentRoundIndex] = {
          targetWord: 'TODO: Get new word from backend',
          submissions: [],
          isComplete: false,
        }
      }
      updatedRounds[currentRoundIndex].submissions.push(newSubmission)

      const updatedGameState = {
        ...gameState,
        rounds: updatedRounds,
      }

      setGameState(updatedGameState)
      localStorage.setItem('gameState', JSON.stringify(updatedGameState))
    } catch (error) {
      console.error('Error submitting prompt:', error)
      throw error
    }
  }

  const submitVote = async (submissionId: string) => {
    if (!gameState || !currentPlayer) return

    const updatedRounds = [...gameState.rounds]
    const currentRound = updatedRounds[gameState.currentRound]
    
    // Remove any existing vote from this player
    currentRound.submissions.forEach(submission => {
      submission.votes = submission.votes.filter(id => id !== currentPlayer.id)
    })

    // Add new vote
    const submission = currentRound.submissions.find(s => s.id === submissionId)
    if (submission) {
      submission.votes.push(currentPlayer.id)
    }

    setGameState({
      ...gameState,
      rounds: updatedRounds
    })
  }

  const startNewRound = async () => {
    if (!gameState) return

    // Calculate scores for the previous round
    const previousRound = gameState.rounds[gameState.currentRound]
    if (previousRound) {
      const updatedPlayers = [...gameState.players]
      previousRound.submissions.forEach(submission => {
        const player = updatedPlayers.find(p => p.id === submission.playerId)
        if (player) {
          player.score += submission.votes.length
        }
      })

      setGameState({
        ...gameState,
        players: updatedPlayers,
        currentRound: gameState.currentRound + 1,
        rounds: [
          ...gameState.rounds,
          {
            targetWord: 'TODO: Get new word from backend',
            submissions: [],
            isComplete: false
          }
        ]
      })
    }
  }

  const endGame = () => {
    if (!gameState) return

    setGameState({
      ...gameState,
      isComplete: true
    })
  }

  const createGame = async (): Promise<string> => {
    try {
      console.log('GameContext: Creating new game...')
      console.log('Current player:', currentPlayer)
      console.log('API URL:', `${API_URL}/games`)
      
      // Generate a random room ID
      const roomId = Math.random().toString(36).substring(2, 8)
      console.log('Generated roomId:', roomId)
      
      const requestBody = {
        roomId,
        playerId: currentPlayer?.id,
        playerName: currentPlayer?.name,
      }
      console.log('Request body:', requestBody)
      
      const response = await fetch(`${API_URL}/games`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      console.log('GameContext: API response status:', response.status)
      console.log('GameContext: API response headers:', Object.fromEntries(response.headers.entries()))
      
      const responseText = await response.text()
      console.log('GameContext: Raw API response:', responseText)
      
      if (!response.ok) {
        console.error('GameContext: API error response:', responseText)
        throw new Error(`Failed to create game: ${responseText}`)
      }

      let data
      try {
        data = JSON.parse(responseText)
        console.log('GameContext: Parsed API response data:', data)
      } catch (e) {
        console.error('GameContext: Failed to parse response as JSON:', e)
        throw new Error('Invalid JSON response from server')
      }
      
      const newGameState: GameState = {
        id: data.id,
        roomId: roomId,
        players: [currentPlayer!],
        currentRound: 0,
        totalRounds: 5,
        rounds: [],
        isComplete: false,
        phase: 'LOBBY',
      }

      console.log('GameContext: Setting new game state:', newGameState)
      setGameState(newGameState)
      localStorage.setItem('gameState', JSON.stringify(newGameState))
      return roomId
    } catch (error) {
      console.error('GameContext: Error creating game:', error)
      throw error
    }
  }

  const refreshGameState = async () => {
    if (!gameState) {
      console.error('Cannot refresh game state: gameState is null')
      return
    }

    try {
      console.log('Refreshing game state...')
      console.log('Current game state:', gameState)
      console.log('Using room ID:', gameState.roomId)
      console.log('API URL:', `${API_URL}/games/${gameState.roomId}`)
      
      const response = await fetch(`${API_URL}/games/${gameState.roomId}`)
      console.log('Refresh response status:', response.status)
      console.log('Refresh response headers:', Object.fromEntries(response.headers.entries()))
      
      const responseText = await response.text()
      console.log('Raw response text:', responseText)
      
      if (!response.ok) {
        console.error('Failed to fetch game state:', responseText)
        throw new Error(`Failed to fetch game state: ${responseText}`)
      }

      let data
      try {
        data = JSON.parse(responseText)
        console.log('Parsed game state:', data)
      } catch (e) {
        console.error('Failed to parse response as JSON:', e)
        throw new Error('Invalid JSON response from server')
      }

      // Ensure current player is in the players list
      if (currentPlayer && data.players) {
        const playerExists = data.players.some(p => p.id === currentPlayer.id)
        if (!playerExists) {
          console.log('Adding current player to refreshed game state')
          data.players = [...data.players, currentPlayer]
        }
      }

      setGameState(data)
      console.log('Game state updated successfully')
    } catch (error) {
      console.error('Error refreshing game state:', error)
      throw error
    }
  }

  const startGame = async () => {
    if (!gameState) return

    try {
      const response = await fetch(`${API_URL}/games/${gameState.roomId}/start`, {
        method: 'POST',
      })
      if (!response.ok) {
        throw new Error('Failed to start game')
      }
      const data = await response.json()
      setGameState(data)
    } catch (error) {
      console.error('Error starting game:', error)
      throw error
    }
  }

  return (
    <GameContext.Provider
      value={{
        gameState,
        currentPlayer,
        submitPrompt,
        submitVote,
        startNewRound,
        createGame,
        refreshGameState,
        startGame,
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