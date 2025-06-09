/// <reference types="vite/client" />
import React, { useEffect } from 'react';
import { Box, useToast } from '@chakra-ui/react';
import { useGame } from '../context/GameContext';
import { useNavigate, useParams } from 'react-router-dom';
import { GameLobby } from '../components/GameLobby';
import { useAuth } from '../context/AuthContext';

const GameRoom = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { gameState, initializeGame, joinGame } = useGame();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  // Initialize game when component mounts
  useEffect(() => {
    const initGame = async () => {
      if (!roomId) {
        navigate('/');
        return;
      }

      try {
        // Fetch the game state directly from the API
        const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/games/${roomId}`);
        if (!response.ok) {
          navigate('/');
          return;
        }
        const data = await response.json();
        // If guest and not in the game, join first (but only if not already joined in this session)
        if (
          currentUser?.isGuest &&
          !data.players.some((p: any) => p.id === currentUser.id) &&
          localStorage.getItem('guestJoined') !== roomId
        ) {
          await joinGame(roomId);
        }
        await initializeGame(roomId);
      } catch (error) {
        navigate('/');
      }
    };

    initGame();
  }, [roomId, currentUser]); // Depend on roomId and currentUser

  // If we have a game state but the room IDs don't match, redirect
  useEffect(() => {
    if (gameState?.roomId && gameState.roomId !== roomId) {
      console.warn('Room ID mismatch detected:', { urlRoomId: roomId, stateRoomId: gameState.roomId });
      navigate(`/game/${gameState.roomId}`);
    }
  }, [gameState?.roomId, roomId, navigate]);

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