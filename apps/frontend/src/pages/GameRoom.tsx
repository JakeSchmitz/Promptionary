/// <reference types="vite/client" />
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';
import GameLobby from '../components/GameLobby';
import { PromptPhase } from '../components/PromptPhase';
import { VotingPhase } from '../components/VotingPhase';
import { ResultsPhase } from '../components/ResultsPhase';
import { PromptophonePhase } from '../components/PromptophonePhase';
import { PromptophoneResults } from '../components/PromptophoneResults';
import { Box, Spinner, Center } from '@chakra-ui/react';
import { API_URL } from '../utils/env';

// Polling interval in milliseconds
const POLLING_INTERVAL = 2000;

export const GameRoom: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { gameState, initializeGame, joinGame, refreshGameState } = useGame();
  const [isInitializing, setIsInitializing] = useState(true);

  // Initial game setup
  useEffect(() => {
    const setupGame = async () => {
      if (!roomId) {
        navigate('/');
        return;
      }

      try {
        setIsInitializing(true);
        await initializeGame(roomId);

        // Fetch the latest game state directly after initialization
        const response = await fetch(`${API_URL}/games/${roomId}`);
        if (!response.ok) throw new Error('Failed to fetch game state');
        const freshGameState = await response.json();

        // Check if user is in the game
        if (currentUser && freshGameState) {
          const isInGame = freshGameState.players.some((p: any) => p.id === currentUser.id);
          if (!isInGame) {
            await joinGame(roomId);
          }
        }
      } catch (error) {
        console.error('Error setting up game:', error);
        navigate('/');
      } finally {
        setIsInitializing(false);
      }
    };

    setupGame();
  }, [roomId, currentUser?.id]);

  // Background polling for game state updates
  useEffect(() => {
    if (!roomId || isInitializing) return;

    const pollGameState = async () => {
      try {
        await refreshGameState();
      } catch (error) {
        console.error('Error polling game state:', error);
      }
    };

    // Initial poll
    pollGameState();

    // Set up interval for polling
    const intervalId = setInterval(pollGameState, POLLING_INTERVAL);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, [roomId, isInitializing]);

  if (isInitializing) {
    return (
      <Center h="100vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  if (!gameState) {
    return null;
  }

  const renderGamePhase = () => {
    if (gameState.phase === 'LOBBY') {
      return <GameLobby />;
    }

    if (gameState.gameMode === 'PROMPTOPHONE') {
      if (gameState.phase === 'PROMPT') {
        return <PromptophonePhase />;
      }
      if (gameState.phase === 'RESULTS') {
        return <PromptophoneResults />;
      }
    } else {
      if (gameState.phase === 'PROMPT') {
        return <PromptPhase />;
      }
      if (gameState.phase === 'VOTING') {
        return <VotingPhase />;
      }
      if (gameState.phase === 'RESULTS') {
        return <ResultsPhase />;
      }
    }

    return null;
  };

  return (
    <Box minH="100vh" bg="gray.50" py={8}>
      {renderGamePhase()}
    </Box>
  );
}; 