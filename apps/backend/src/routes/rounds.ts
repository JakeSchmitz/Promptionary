import { Router } from 'express';
import prisma from '../db';
import { ROUND_DURATION, getRandomWord } from '../utils/game-utils';

const router = Router();

// Check round submission status
router.get('/:roomId/round/status', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { playerId, gameMode } = req.query;

    const game = await prisma.game.findUnique({
      where: { roomId },
      include: {
        playerGames: { include: { player: true } },
        images: {
          include: {
            player: true,
          },
        },
        promptChains: true,
      },
    });

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    let allPlayersSubmitted = false;
    let hasSubmitted = false;

    if (game.gameMode === 'PROMPTOPHONE') {
      // For Promptophone, check if each player has submitted for their assigned chain in this round
      allPlayersSubmitted = game.playerGames.every(pg => {
        const numPlayers = game.playerGames.length;
        const playerIndex = game.playerGames.findIndex(p => p.playerId === pg.playerId);
        const chainIndex = (playerIndex + game.currentRound - 1) % numPlayers;
        const promptChain = game.promptChains[chainIndex];
        
        if (!promptChain) return false;
        
        // Check if this player has submitted for this round/chain
        return (promptChain.chain as any[]).some((entry: any) => entry.playerId === pg.playerId);
      });

      // Check if the specific player has submitted
      if (playerId) {
        const playerIndex = game.playerGames.findIndex(p => p.playerId === playerId);
        const chainIndex = (playerIndex + game.currentRound - 1) % game.playerGames.length;
        const promptChain = game.promptChains[chainIndex];
        
        if (promptChain) {
          hasSubmitted = (promptChain.chain as any[]).some((entry: any) => entry.playerId === playerId);
        }
      }
    } else {
      // For Prompt Anything, check if all players have submitted images
      allPlayersSubmitted = game.playerGames.every(pg => 
        game.images.some(image => image.playerId === pg.playerId)
      );

      // Check if the specific player has submitted
      if (playerId) {
        hasSubmitted = game.images.some(image => image.playerId === playerId);
      }
    }

    const roundStartTime = game.roundStartTime;
    const now = new Date();
    const timeElapsed = roundStartTime ? (now.getTime() - roundStartTime.getTime()) / 1000 : 0;
    const timeRemaining = Math.max(0, Math.ceil(ROUND_DURATION - timeElapsed));

    res.json({
      allPlayersSubmitted,
      hasSubmitted,
      timeRemaining,
      shouldEndRound: allPlayersSubmitted || timeRemaining <= 0,
    });
  } catch (error) {
    console.error('Error checking submission status:', error);
    res.status(500).json({ error: 'Failed to check submission status' });
  }
});

// End the current round
router.post('/:roomId/end-round', async (req, res) => {
  try {
    const { roomId } = req.params;

    const game = await prisma.game.findUnique({
      where: { roomId },
      include: {
        playerGames: { include: { player: true } },
        images: true,
        promptChains: true,
      },
    });

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    if (game.gameMode === 'PROMPTOPHONE') {
      // For Promptophone, check if we've completed all rounds
      const totalRounds = game.playerGames.length;
      if (game.currentRound >= totalRounds) {
        // Game is complete, move to results
        const updatedGame = await prisma.game.update({
          where: { roomId },
          data: { 
            phase: 'RESULTS',
            roundStartTime: new Date(),
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
        return res.json(updatedGame);
      } else {
        // Start the next round automatically
        const nextChainIndex = game.currentRound;
        const nextChain = game.promptChains[nextChainIndex];
        
        // Get the last image from the previous round to use as the word for next round
        const lastRoundImages = game.images.filter((img: any) => 
          img.createdAt > new Date(Date.now() - 60000) // Images from the last minute
        );
        
        // Use the last generated image URL as the current word for the next round
        const currentWord = lastRoundImages[0]?.url || nextChain?.originalWord || '';

        const updatedGame = await prisma.game.update({
          where: { roomId },
          data: {
            currentRound: game.currentRound + 1,
            phase: 'PROMPT',
            currentWord: currentWord,
            roundStartTime: new Date(),
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
        return res.json(updatedGame);
      }
    } else {
      // For Prompt Anything, move to voting phase
      const updatedGame = await prisma.game.update({
        where: { roomId },
        data: {
          phase: 'VOTING',
          roundStartTime: new Date(),
        },
        include: {
          playerGames: { include: { player: true } },
          images: {
            include: {
              player: true,
              votes: true,
            },
          },
        },
      });
      return res.json(updatedGame);
    }
  } catch (error) {
    console.error('Error ending round:', error);
    res.status(500).json({ error: 'Failed to end round' });
  }
});

// Start next round
router.post('/:roomId/next-round', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { playerId } = req.body;

    const game = await prisma.game.findUnique({
      where: { roomId },
      include: { 
        playerGames: { include: { player: true } },
        promptChains: true,
        images: {
          include: {
            player: true,
          },
        },
      }
    });

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Verify the player is the host
    const host = game.playerGames.find(pg => pg.isHost);
    if (!host || host.playerId !== playerId) {
      return res.status(403).json({ error: 'Only the host can start the next round' });
    }

    if (game.gameMode === 'PROMPTOPHONE') {
      // For Promptophone, check if we've completed all rounds
      const totalRounds = game.playerGames.length;
      if (game.currentRound >= totalRounds) {
        const updatedGame = await prisma.game.update({
          where: { roomId },
          data: { 
            phase: 'RESULTS',
            roundStartTime: new Date(),
          },
        });
        return res.json(updatedGame);
      }

      // Find the next prompt chain to work on
      const nextChainIndex = game.currentRound;
      const nextChain = game.promptChains[nextChainIndex];
      
      // Get the last image from the previous round
      const lastRoundImages = game.images.filter(img => 
        img.createdAt > new Date(Date.now() - 60000) // Images from the last minute
      );
      
      // If this is the first round, use the original word
      // Otherwise, use the last generated image
      const currentWord = game.currentRound === 1 
        ? nextChain.originalWord 
        : lastRoundImages[0]?.url || nextChain.originalWord;

      // Move to next round
      const updatedGame = await prisma.game.update({
        where: { roomId },
        data: {
          currentRound: game.currentRound + 1,
          phase: 'PROMPT',
          currentWord: currentWord,
          roundStartTime: new Date(),
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

      res.json(updatedGame);
    } else {
      // Original Prompt Anything logic
      if (game.currentRound >= game.maxRounds) {
        const updatedGame = await prisma.game.update({
          where: { roomId },
          data: { phase: 'RESULTS' },
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
        return res.json(updatedGame);
      }

      // Get a random word with its exclusion words
      const randomWord = getRandomWord();

      const updatedGame = await prisma.game.update({
        where: { roomId },
        data: {
          currentRound: game.currentRound + 1,
          phase: 'PROMPT',
          currentWord: randomWord.word,
          exclusionWords: randomWord.exclusionWords,
          roundStartTime: new Date(),
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

      res.json(updatedGame);
    }
  } catch (error) {
    console.error('Error starting next round:', error);
    res.status(500).json({ error: 'Failed to start next round' });
  }
});

export default router;