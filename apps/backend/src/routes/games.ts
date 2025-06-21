import { Router } from 'express';
import prisma from '../db';
import { gameWords } from '../data/words';
import { getRandomWord, formatGameResponse } from '../utils/game-utils';

const router = Router();

// Create a new game
router.post('/', async (req, res) => {
  try {
    const { roomId, playerId, playerName, gameMode } = req.body;
    
    if (!playerName) {
      return res.status(400).json({ error: 'Player name is required' });
    }

    // Create the game and the host player in a transaction
    const game = await prisma.$transaction(async (prisma) => {
      // Create the game first
      const game = await prisma.game.create({
        data: {
          roomId,
          currentWord: getRandomWord().word,
          currentRound: 0,
          maxRounds: 3, // Set default number of rounds
          phase: 'LOBBY',
          gameMode: gameMode || 'PROMPT_ANYTHING', // Default to PROMPT_ANYTHING if not specified
        },
      });

      // Create or find the player
      let player = await prisma.player.findUnique({
        where: { id: playerId }
      });
      if (!player) {
        player = await prisma.player.create({
          data: {
            id: playerId,
            name: playerName,
            email: playerId, // Store the auth ID in the email field for reference
          },
        });
      }

      // Create PlayerGame association for host if not already present
      const existingPG = await prisma.playerGame.findUnique({
        where: { playerId_gameId: { playerId: player.id, gameId: game.id } }
      });
      if (!existingPG) {
        await prisma.playerGame.create({
          data: {
            playerId: player.id,
            gameId: game.id,
            isHost: true,
          },
        });
      }

      // Update the game with the host ID
      await prisma.game.update({
        where: { id: game.id },
        data: { hostId: player.id },
      });

      // Return the full game state
      return prisma.game.findUnique({
        where: { id: game.id },
        include: {
          playerGames: { include: { player: true } },
          images: {
            include: {
              player: true,
              votes: true,
            },
          },
          promptChains: true,
        },
      });
    });

    // Ensure the game mode is included in the response
    const response = {
      ...game,
      gameMode: game?.gameMode || 'PROMPT_ANYTHING',
    };

    res.json(response);
  } catch (error) {
    console.error('Error creating game:', error);
    res.status(500).json({ error: 'Failed to create game' });
  }
});

// Get game by room ID
router.get('/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    console.log('Fetching game state for room:', roomId);

    const game = await prisma.game.findUnique({
      where: { roomId },
      include: {
        playerGames: { include: { player: true } },
        images: {
          include: {
            player: true,
            votes: true,
          },
        },
        promptChains: true,
      },
    });

    if (!game) {
      console.log('Game not found for room:', roomId);
      return res.status(404).json({ error: 'Game not found' });
    }

    console.log('Game state retrieved:', {
      gameMode: game.gameMode,
      phase: game.phase,
      currentRound: game.currentRound,
      playerCount: game.playerGames.length,
      promptChainCount: game.promptChains?.length
    });

    const response = formatGameResponse(game);

    console.log('Sending response:', {
      gameMode: response.gameMode,
      phase: response.phase,
      currentRound: response.currentRound
    });

    res.json(response);
  } catch (error) {
    console.error('Error fetching game:', error);
    res.status(500).json({ error: 'Failed to fetch game' });
  }
});

// Start game
router.post('/:roomId/start', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { playerId } = req.body;

    console.log('Starting game for room:', roomId, 'playerId:', playerId);

    const game = await prisma.game.findUnique({
      where: { roomId },
      include: { 
        playerGames: { include: { player: true } },
        promptChains: true,
      }
    });

    if (!game) {
      console.log('Game not found for room:', roomId);
      return res.status(404).json({ error: 'Game not found' });
    }

    // Verify the player is the host
    const host = game.playerGames.find(pg => pg.isHost);
    if (!host || host.playerId !== playerId) {
      console.log('Player is not host:', { playerId, hostId: host?.playerId });
      return res.status(403).json({ error: 'Only the host can start the game' });
    }

    // Get the game mode from the game state
    const gameMode = game.gameMode || 'PROMPT_ANYTHING';
    console.log('Starting game with mode:', {
      gameMode,
      currentGameMode: game.gameMode,
      roomId,
      playerCount: game.playerGames.length,
      players: game.playerGames.map(pg => ({ playerId: pg.playerId, name: pg.player.name, isHost: pg.isHost }))
    });

    if (gameMode === 'PROMPTOPHONE') {
      try {
        // For Promptophone, create a prompt chain for each player with unique words
        // Shuffle the words array to get random unique words
        const shuffledWords = [...gameWords]
          .sort(() => Math.random() - 0.5)
          .slice(0, game.playerGames.length);

        console.log('Creating prompt chains for Promptophone:', {
          playerCount: game.playerGames.length,
          wordCount: shuffledWords.length,
          words: shuffledWords.map(w => w.word)
        });

        // Create a prompt chain for each player with a unique word
        const promptChains = await Promise.all(
          game.playerGames.map(async (pg, index) => {
            const word = shuffledWords[index];
            console.log(`Creating chain for player ${pg.player.name} with word: ${word.word}`);
            return prisma.promptChain.create({
              data: {
                gameId: game.id,
                playerId: pg.playerId, // Associate the chain with the specific player
                originalWord: word.word,
                chain: [], // Initialize empty chain
              },
            });
          })
        );

        // Get the first player's chain to start with
        const firstPlayerChain = promptChains[0];
        console.log('Starting with first player chain:', {
          playerId: firstPlayerChain.playerId,
          word: firstPlayerChain.originalWord
        });

        // Set the first word for the first round
        const updatedGame = await prisma.game.update({
          where: { roomId },
          data: {
            phase: 'PROMPT',
            currentRound: 1,
            currentWord: firstPlayerChain.originalWord,
            exclusionWords: shuffledWords[0].exclusionWords,
            roundStartTime: new Date(),
            gameMode: 'PROMPTOPHONE', // Explicitly set the game mode
          },
          include: {
            playerGames: { include: { player: true } },
            images: {
              include: {
                player: true,
                votes: true,
              },
            },
            promptChains: true,
          },
        });

        // Log the updated game state
        console.log('Updated game state for Promptophone:', {
          phase: updatedGame.phase,
          gameMode: updatedGame.gameMode,
          currentRound: updatedGame.currentRound,
          currentWord: updatedGame.currentWord,
          promptChainCount: updatedGame.promptChains?.length,
          chains: updatedGame.promptChains?.map(chain => ({
            playerId: chain.playerId,
            word: chain.originalWord
          }))
        });

        // Ensure game mode is included in the response
        const response = {
          ...updatedGame,
          gameMode: 'PROMPTOPHONE',
        };

        res.json(response);
      } catch (error) {
        console.error('Error in Promptophone game start:', error);
        throw error;
      }
    } else {
      // Original Prompt Anything logic
      try {
        const randomWord = getRandomWord();
        const updatedGame = await prisma.game.update({
          where: { roomId },
          data: {
            phase: 'PROMPT',
            currentRound: 1,
            currentWord: randomWord.word,
            exclusionWords: randomWord.exclusionWords,
            roundStartTime: new Date(),
            gameMode: 'PROMPT_ANYTHING', // Explicitly set the game mode
          },
          include: {
            playerGames: { include: { player: true } },
            images: {
              include: {
                player: true,
                votes: true,
              },
            },
            promptChains: true,
          },
        });

        console.log('Updated game state for Prompt Anything:', {
          phase: updatedGame.phase,
          gameMode: updatedGame.gameMode,
          currentRound: updatedGame.currentRound,
          currentWord: updatedGame.currentWord
        });

        // Ensure game mode is included in the response
        const response = {
          ...updatedGame,
          gameMode: 'PROMPT_ANYTHING',
        };

        res.json(response);
      } catch (error) {
        console.error('Error in Prompt Anything game start:', error);
        throw error;
      }
    }
  } catch (error) {
    console.error('Error starting game:', error);
    res.status(500).json({ error: 'Failed to start game' });
  }
});

export default router;