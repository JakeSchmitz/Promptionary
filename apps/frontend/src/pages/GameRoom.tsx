import React, { useEffect } from 'react';
import { Box, useToast } from '@chakra-ui/react';
import { useGame } from '../context/GameContext';
import { useNavigate, useParams } from 'react-router-dom';
import { GameLobby } from '../components/GameLobby';

const GameRoom = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { gameState, refreshGameState } = useGame();
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    if (!roomId) {
      navigate('/');
      return;
    }

    // Fetch game state whenever roomId changes
    refreshGameState().catch((error) => {
      console.error('Error fetching game state:', error);
      toast({
        title: 'Error',
        description: 'Failed to load game state',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    });
  }, [roomId, navigate, toast]);

  // If we have a game state but the room IDs don't match, redirect
  useEffect(() => {
    if (gameState && gameState.roomId !== roomId) {
      console.warn('Room ID mismatch detected:', { urlRoomId: roomId, stateRoomId: gameState.roomId });
      navigate(`/game/${gameState.roomId}`);
    }
  }, [gameState, roomId, navigate]);

  if (!gameState) {
    return null;
  }

  return (
    <Box p={4}>
      <GameLobby />
    </Box>
  );
};

export default GameRoom; 