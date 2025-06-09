/// <reference types="vite/client" />
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { useAuth } from '../context/AuthContext';
import { GameLobby } from '../components/GameLobby';

const GameRoom = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { gameState, initializeGame, joinGame } = useGame();
  const { currentUser } = useAuth();

  useEffect(() => {
    const setupGame = async () => {
      if (!roomId) return;

      try {
        // Initialize game state
        await initializeGame(roomId);

        // If we have a guest user, make sure they're in the game
        if (currentUser?.isGuest) {
          const isInGame = gameState?.players.some(p => p.id === currentUser.id);
          if (!isInGame) {
            await joinGame(roomId);
          }
        }
      } catch (error) {
        console.error('Error setting up game:', error);
        navigate('/');
      }
    };

    setupGame();
  }, [roomId, currentUser?.isGuest]);

  if (!gameState) {
    return null;
  }

  return <GameLobby />;
};

export default GameRoom; 