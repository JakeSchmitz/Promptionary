import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const API_URL = 'http://localhost:3000/api';

interface Player {
  id: string;
  name: string;
  score: number;
  isHost: boolean;
  email?: string;
}

interface Submission {
  id: string;
  playerId: string;
  prompt: string;
  imageUrl: string;
  votes: number;
}

interface Round {
  targetWord: string;
  submissions: Submission[];
  isComplete: boolean;
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
  id: string;
  roomId: string;
  players: Player[];
  currentRound: number;
  maxRounds: number;
  currentWord?: string;
  exclusionWords?: string[];
  rounds: Round[];
  isComplete: boolean;
  phase: 'LOBBY' | 'PROMPT' | 'VOTING' | 'RESULTS' | 'ENDED';
  gameMode: 'PROMPT_ANYTHING' | 'PROMPTOPHONE';
  images?: Array<{
    id: string;
    url: string;
    prompt: string;
    playerId: string;
    votes: Array<{
      id: string;
      voterId: string;
    }>;
  }>;
  promptChains?: PromptChain[];
}

interface GameContextType {
  gameState: GameState | null;
  currentPlayer: Player | null;
  playerName: string | null;
  submitPrompt: (prompt: string) => Promise<void>;
  submitVote: (submissionId: string) => Promise<void>;
  startNewRound: () => Promise<void>;
  createGame: (gameMode: 'PROMPT_ANYTHING' | 'PROMPTOPHONE') => Promise<string>;
  refreshGameState: () => Promise<void>;
  startGame: () => Promise<void>;
  joinGame: (roomId: string) => Promise<void>;
  initializeGame: (roomId: string) => Promise<void>;
  onEndVoting: () => Promise<void>;
  setGameState: (state: GameState) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const location = useLocation();
  const { currentUser } = useAuth();

  // Update currentPlayer when auth user changes
  useEffect(() => {
    if (currentUser) {
      setCurrentPlayer({
        id: currentUser.id,
        name: currentUser.name,
        score: 0,
        isHost: false,
        email: currentUser.email,
      });
    }
  }, [currentUser]);

  const refreshGameState = async () => {
    try {
      const response = await fetch(`${API_URL}/games/${gameState?.roomId}`);
      const data = await response.json();
      setGameState(data);
    } catch (error) {
      console.error('Error refreshing game state:', error);
    }
  };

  const submitPrompt = async (prompt: string) => {
    try {
      await fetch(`${API_URL}/games/${gameState?.roomId}/prompts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, playerId: currentPlayer?.id }),
      });
      // Update game state to simulate prompt submission
      if (gameState) {
        setGameState({
          ...gameState,
          phase: 'VOTING',
        });
      }
    } catch (error) {
      console.error('Error submitting prompt:', error);
    }
  };

  const submitVote = async (submissionId: string) => {
    try {
      await fetch(`${API_URL}/games/${gameState?.roomId}/votes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId, voterId: currentPlayer?.id }),
      });
      // Update game state to simulate vote submission
      if (gameState) {
        setGameState({
          ...gameState,
          phase: 'RESULTS',
        });
      }
    } catch (error) {
      console.error('Error submitting vote:', error);
    }
  };

  const startNewRound = async () => {
    try {
      await fetch(`${API_URL}/games/${gameState?.roomId}/rounds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: currentPlayer?.id }),
      });
      // Update game state to simulate new round
      if (gameState) {
        setGameState({
          ...gameState,
          currentRound: gameState.currentRound + 1,
          phase: 'PROMPT',
        });
      }
    } catch (error) {
      console.error('Error starting new round:', error);
    }
  };

  const createGame = async (gameMode: 'PROMPT_ANYTHING' | 'PROMPTOPHONE'): Promise<string> => {
    try {
      const roomId = Math.random().toString(36).substring(2, 8);
      const response = await fetch(`${API_URL}/games`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          playerId: currentPlayer?.id,
          playerName: currentPlayer?.name,
          gameMode,
        }),
      });
      const data = await response.text();
      const parsedData = JSON.parse(data);
      setGameState(parsedData);
      return roomId;
    } catch (error) {
      console.error('Error creating game:', error);
      throw error;
    }
  };

  const startGame = async () => {
    try {
      await fetch(`${API_URL}/games/${gameState?.roomId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: currentPlayer?.id }),
      });
      // Update game state to simulate game start
      if (gameState) {
        setGameState({
          ...gameState,
          phase: 'PROMPT',
          currentRound: 1,
        });
      }
    } catch (error) {
      console.error('Error starting game:', error);
    }
  };

  const joinGame = async (roomId: string) => {
    try {
      await fetch(`${API_URL}/games/${roomId}/players`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: currentPlayer?.name,
          playerId: currentPlayer?.id,
        }),
      });
      // Update game state to simulate player join
      if (gameState) {
        setGameState({
          ...gameState,
          players: [
            ...gameState.players,
            {
              id: currentPlayer?.id || '',
              name: currentPlayer?.name || '',
              score: 0,
              isHost: false,
            },
          ],
        });
      }
    } catch (error) {
      console.error('Error joining game:', error);
    }
  };

  const initializeGame = async (roomId: string) => {
    try {
      await fetch(`${API_URL}/games/${roomId}`);
      // Set initial game state
      setGameState({
        id: 'test-game',
        roomId,
        players: [],
        currentRound: 0,
        maxRounds: 3,
        rounds: [],
        isComplete: false,
        phase: 'LOBBY',
        gameMode: 'PROMPTOPHONE',
      });
    } catch (error) {
      console.error('Error initializing game:', error);
    }
  };

  const onEndVoting = async () => {
    try {
      await fetch(`${API_URL}/games/${gameState?.roomId}/voting/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: currentPlayer?.id }),
      });
      // Update game state to simulate voting end
      if (gameState) {
        setGameState({
          ...gameState,
          phase: 'RESULTS',
        });
      }
    } catch (error) {
      console.error('Error ending voting:', error);
    }
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
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}; 