import React, { createContext, useContext, useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { useToast } from '@chakra-ui/react'
import { API_URL } from '../utils/env'

console.log('API_URL:', API_URL)

interface Player {
  id: string
  name: string
  score: number
  isHost: boolean
  email?: string
}

interface Submission {
  id: string
  playerId: string
  prompt: string
  imageUrl: string
  votes: number
}

interface Round {
  targetWord: string
  submissions: Submission[]
  isComplete: boolean
}

interface PromptChain {
  id: string;
  gameId: string;
  playerId: string;
  originalWord: string;
  chain: Array<{
    playerId: string;
    prompt: string;
    imageUrl: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface GameState {
  id: string
  roomId: string
  players: Player[]
  currentRound: number
  maxRounds: number
  currentWord?: string
  exclusionWords?: string[]
  rounds: Round[]
  isComplete: boolean
  phase: 'LOBBY' | 'PROMPT' | 'VOTING' | 'RESULTS' | 'ENDED'
  gameMode: 'PROMPT_ANYTHING' | 'PROMPTOPHONE'
  images?: Array<{
    id: string
    url: string
    prompt: string
    playerId: string
    votes: Array<{
      id: string
      voterId: string
    }>
  }>
  promptChains?: PromptChain[]
}

interface GameContextType {
  gameState: GameState | null
  currentPlayer: Player | null
  playerName: string | null
  submitPrompt: (prompt: string) => Promise<void>
  submitVote: (submissionId: string) => Promise<void>
  startNewRound: () => Promise<void>
  createGame: (gameMode: 'PROMPT_ANYTHING' | 'PROMPTOPHONE') => Promise<string>
  refreshGameState: () => Promise<void>
  startGame: () => Promise<void>
  joinGame: (roomId: string) => Promise<void>
  initializeGame: (roomId: string) => Promise<void>
  onEndVoting: () => Promise<void>
  setGameState: (state: GameState) => void
}

const GameContext = createContext<GameContextType | undefined>(undefined)

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null)
  const location = useLocation()
  const { currentUser } = useAuth()
  const toast = useToast()

  // Update currentPlayer when auth user changes
  useEffect(() => {
    if (currentUser) {
      setCurrentPlayer({
        id: currentUser.id,
        name: currentUser.name,
        score: 0,
        isHost: false, // Default to false, will be updated when game state is loaded
        email: currentUser.email
      })
    } else {
      // Clear guest joined flag when user logs out
      localStorage.removeItem('guestJoined')
    }
  }, [currentUser])

  // Clear guest joined flag when game state changes
  useEffect(() => {
    if (!gameState) {
      localStorage.removeItem('guestJoined')
    }
  }, [gameState])

  // Get room ID from URL or localStorage
  const getRoomId = () => {
    // First try to get from URL
    const urlRoomId = location.pathname.split('/game/')[1]
    if (urlRoomId) {
      // If we have a URL room ID, update localStorage
      localStorage.setItem('roomId', urlRoomId)
      return urlRoomId
    }
    // Fall back to localStorage
    return localStorage.getItem('roomId')
  }

  const refreshGameState = async () => {
    try {
      const roomId = getRoomId()
      if (!roomId) {
        throw new Error('No room ID found')
      }

      const response = await fetch(`${API_URL}/games/${roomId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch game state')
      }

      const data = await response.json()
      
      // Update game state
      setGameState(data)
      
      // Update current player if we have one
      if (currentUser) {
        const player = data.players.find((p: Player) => p.id === currentUser.id)
        if (player) {
          setCurrentPlayer(player)
        }
      }

      // Store in localStorage
      localStorage.setItem('gameState', JSON.stringify(data))
    } catch (error) {
      console.error('Error refreshing game state:', error)
      throw error
    }
  }

  // Load initial state from localStorage and server
  useEffect(() => {
    let isMounted = true;

    const loadInitialState = async () => {
      const roomId = getRoomId()
      if (roomId && isMounted) {
        try {
          const response = await fetch(`${API_URL}/games/${roomId}`)
          if (!response.ok) {
            throw new Error('Failed to fetch game state')
          }

          const data = await response.json()
          
          if (isMounted) {
            // Update game state
            setGameState(data)
            
            // Update current player if we have one
            if (currentUser) {
              const player = data.players.find((p: Player) => p.id === currentUser.id)
              if (player) {
                setCurrentPlayer(player)
              }
            }

            // Store in localStorage
            localStorage.setItem('gameState', JSON.stringify(data))
          }
        } catch (error) {
          console.error('Error loading initial game state:', error)
        }
      }
    }

    loadInitialState()

    return () => {
      isMounted = false
    }
  }, []) // Empty dependency array ensures this only runs once on mount

  // Save game state to localStorage whenever it changes
  useEffect(() => {
    if (gameState) {
      localStorage.setItem('gameState', JSON.stringify(gameState))
    }
  }, [gameState])

  const submitPrompt = async (prompt: string) => {
    if (!gameState || !currentPlayer) return;

    try {
      // First submit the prompt
      const promptResponse = await fetch(`${API_URL}/games/${gameState.roomId}/prompts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerId: currentPlayer.id,
          prompt,
        }),
      });

      if (!promptResponse.ok) {
        throw new Error('Failed to submit prompt');
      }

      // Get the updated game state after prompt submission
      const promptData = await promptResponse.json();
      setGameState(promptData);

      // Then generate the image
      const imageResponse = await fetch(`${API_URL}/games/${gameState.roomId}/generate-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          playerId: currentPlayer.id,
        }),
      });

      if (!imageResponse.ok) {
        throw new Error('Failed to generate image');
      }

      // Get the final game state with the generated image
      const imageData = await imageResponse.json();
      setGameState(imageData);
    } catch (error) {
      console.error('Error in prompt submission flow:', error);
      throw error;
    }
  };

  const submitVote = async (submissionId: string) => {
    if (!gameState || !currentPlayer) return

    const updatedRounds = [...gameState.rounds]
    const currentRound = updatedRounds[gameState.currentRound]
    
    // Remove any existing vote from this player
    currentRound.submissions.forEach(submission => {
      submission.votes = 0
    })

    // Add new vote
    const submission = currentRound.submissions.find(s => s.id === submissionId)
    if (submission) {
      submission.votes = 1
    }

    setGameState({
      ...gameState,
      rounds: updatedRounds
    })
  }

  const startNewRound = async () => {
    if (!gameState || !currentPlayer) return;

    try {
      const response = await fetch(`${API_URL}/games/${gameState.roomId}/next-round`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerId: currentPlayer.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start next round');
      }

      const data = await response.json();
      setGameState(data);
    } catch (error) {
      console.error('Error starting next round:', error);
      throw error;
    }
  };

  const endGame = () => {
    if (!gameState) return

    setGameState({
      ...gameState,
      isComplete: true
    })
  }

  const createGame = async (gameMode: 'PROMPT_ANYTHING' | 'PROMPTOPHONE'): Promise<string> => {
    try {
      if (!currentUser) {
        throw new Error('You must be logged in to create a game')
      }

      console.log('GameContext: Creating new game...')
      console.log('Current user:', currentUser)
      console.log('API URL:', `${API_URL}/games`)
      console.log('Selected game mode:', gameMode)
      
      // Generate a random room ID
      const roomId = Math.random().toString(36).substring(2, 8)
      console.log('Generated roomId:', roomId)
      
      const requestBody = {
        roomId,
        playerId: currentUser.id,
        playerName: currentUser.name,
        gameMode,
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
      
      // Use the server response directly
      const newGameState: GameState = {
        id: data.id,
        roomId: data.roomId,
        players: data.players,
        currentRound: data.currentRound,
        maxRounds: data.maxRounds,
        currentWord: data.currentWord,
        exclusionWords: data.exclusionWords,
        rounds: [],
        isComplete: false,
        phase: 'LOBBY',
        gameMode: data.gameMode || gameMode, // Ensure game mode is set
        images: data.images,
        promptChains: data.promptChains,
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

  const startGame = async () => {
    if (!gameState || !currentPlayer) return

    try {
      console.log('Starting game with state:', {
        roomId: gameState.roomId,
        playerId: currentPlayer.id,
        gameMode: gameState.gameMode,
        phase: gameState.phase,
        isHost: currentPlayer.isHost
      });

      const response = await fetch(`${API_URL}/games/${gameState.roomId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerId: currentPlayer.id,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`Failed to start game: ${errorText}`);
      }

      const data = await response.json();
      console.log('Game started successfully:', {
        phase: data.phase,
        gameMode: data.gameMode,
        currentRound: data.currentRound,
        currentWord: data.currentWord
      });
      setGameState(data);
    } catch (error) {
      console.error('Error starting game:', error);
      throw error;
    }
  }

  const joinGame = async (roomId: string) => {
    try {
      if (!currentUser) {
        throw new Error('No user found');
      }

      const playerResponse = await fetch(`${API_URL}/games/${roomId}/players`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: currentUser.name,
          playerId: currentUser.id,
        }),
      });

      if (!playerResponse.ok) {
        throw new Error('Failed to join game');
      }

      // Get the updated game state
      const updatedGameState = await playerResponse.json();
      
      // Update the game state directly
      setGameState(updatedGameState);
      
      // Store the game state and room ID
      localStorage.setItem('gameState', JSON.stringify(updatedGameState));
      localStorage.setItem('roomId', roomId);
    } catch (error) {
      console.error('Error joining game:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to join game',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      throw error;
    }
  };

  const initializeGame = async (roomId: string) => {
    try {
      // First verify the game exists
      const gameResponse = await fetch(`${API_URL}/games/${roomId}`);
      if (!gameResponse.ok) {
        throw new Error('Game not found');
      }

      // Get the current game state
      const gameState = await gameResponse.json();
      setGameState(gameState);
      // Always store the room ID
      localStorage.setItem('roomId', roomId);
      localStorage.setItem('gameState', JSON.stringify(gameState));
    } catch (error) {
      console.error('Error initializing game:', error);
      throw error;
    }
  };

  const onEndVoting = async () => {
    // Implementation of onEndVoting function
  };

  return (
    <GameContext.Provider
      value={{
        gameState,
        currentPlayer,
        playerName: currentUser?.name || null,
        submitPrompt,
        submitVote,
        startNewRound,
        createGame,
        refreshGameState,
        startGame,
        joinGame,
        initializeGame,
        onEndVoting,
        setGameState,
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