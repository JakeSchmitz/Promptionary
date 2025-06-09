/// <reference types="vite/client" />
import React, { useEffect } from 'react';
import { Box, useToast } from '@chakra-ui/react';
import { useGame } from '../context/GameContext';
import { useNavigate, useParams } from 'react-router-dom';
import { GameLobby } from '../components/GameLobby';
import { useAuth } from '../context/AuthContext';

const GameRoom = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { gameState, initializeGame } = useGame();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  // Initialize game when component mounts
  useEffect(() => {
    if (!roomId) {
      navigate('/');
      return;
    }

    let isMounted = true;

    const setupGame = async () => {
      try {
        if (isMounted) {
          await initializeGame(roomId);
        }
      } catch (error) {
        if (isMounted) {
          navigate('/');
        }
      }
    };

    setupGame();

    return () => {
      isMounted = false;
    };
  }, [roomId, navigate, initializeGame]);

  // If we have a game state but the room IDs don't match, redirect
  useEffect(() => {
    if (gameState && gameState.roomId && gameState.roomId !== roomId) {
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