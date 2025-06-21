import { Router } from 'express';
import prisma from '../db';
import { gameWords } from '../data/words';
import { formatGameResponse, getExclusionWords } from '../utils/game-utils';

const router = Router();

// Submit a prompt
router.post('/:roomId/prompts', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { prompt, playerId } = req.body;

    if (!prompt || !playerId) {
      return res.status(400).json({ error: 'Prompt and playerId are required' });
    }

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

    // Verify the player is in the game
    const player = game.playerGames.find(pg => pg.playerId === playerId);
    if (!player) {
      return res.status(403).json({ error: 'Player not in game' });
    }

    // --- PHASE & SUBMISSION LOGIC ---
    // For PROMPT_ANYTHING, a player can only submit once per game/round
    // For PROMPTOPHONE, a player can submit once per round/chain (handled below)
    if (game.gameMode !== 'PROMPTOPHONE') {
      // For Prompt Anything, block if player already submitted
      const existingSubmission = game.images.find(img => img.playerId === playerId);
      if (existingSubmission) {
        return res.status(400).json({ error: 'Player has already submitted a prompt' });
      }
    }

    if (game.gameMode === 'PROMPTOPHONE') {
      // --- ROUND-BASED CHAIN ASSIGNMENT LOGIC ---
      // Each player is assigned a different chain each round, rotating through all chains
      // Players should be able to submit once per round/chain
      const numPlayers = game.playerGames.length;
      const playerIndex = game.playerGames.findIndex(p => p.playerId === playerId);
      const chainIndex = (playerIndex + game.currentRound - 1) % numPlayers;
      const promptChain = game.promptChains[chainIndex];
      
      if (!promptChain) {
        console.error('No prompt chain found for round-based assignment:', {
          playerId,
          playerIndex,
          chainIndex,
          availableChains: game.promptChains?.map((c, idx) => ({ idx, playerId: c.playerId, word: c.originalWord }))
        });
        return res.status(400).json({ error: 'No prompt chain found for this round' });
      }

      // Prevent duplicate submissions for this round/chain by this player
      const alreadySubmitted = (promptChain.chain as any[]).some((entry: any) => entry.playerId === playerId);
      if (alreadySubmitted) {
        return res.status(400).json({ error: 'Player has already submitted a prompt for this round' });
      }

      // Create the image submission with a placeholder URL
      const image = await prisma.image.create({
        data: {
          prompt,
          playerId,
          gameId: game.id,
          url: `placeholder-${Date.now()}`,
        },
      });

      // Update the prompt chain for this round
      await prisma.promptChain.update({
        where: { id: promptChain.id },
        data: {
          chain: [...(promptChain.chain as any[]), { playerId, prompt, imageUrl: image.url }],
        },
      });
    } else {
      // Original Prompt Anything logic
      // Each player submits a prompt for the round
      const image = await prisma.image.create({
        data: {
          prompt,
          playerId,
          gameId: game.id,
          url: `placeholder-${Date.now()}`, // Placeholder URL until we generate the actual image
        },
      });
    }

    // Get updated game state
    const updatedGame = await prisma.game.findUnique({
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

    if (!updatedGame) {
      throw new Error('Failed to fetch updated game state');
    }

    const response = formatGameResponse(updatedGame);
    res.json(response);
  } catch (error) {
    console.error('Error submitting prompt:', error);
    res.status(500).json({ error: 'Failed to submit prompt' });
  }
});

// Auto-submit prompt when timer expires
router.post('/:roomId/auto-submit', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { prompt, playerId } = req.body;

    if (!prompt || !playerId) {
      return res.status(400).json({ error: 'Prompt and playerId are required' });
    }

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

    // Verify the player is in the game
    const player = game.playerGames.find(pg => pg.playerId === playerId);
    if (!player) {
      return res.status(403).json({ error: 'Player not in game' });
    }

    // Check if player has already submitted
    let alreadySubmitted = false;
    if (game.gameMode === 'PROMPTOPHONE') {
      const numPlayers = game.playerGames.length;
      const playerIndex = game.playerGames.findIndex(p => p.playerId === playerId);
      const chainIndex = (playerIndex + game.currentRound - 1) % numPlayers;
      const promptChain = game.promptChains[chainIndex];
      
      if (promptChain) {
        alreadySubmitted = (promptChain.chain as any[]).some((entry: any) => entry.playerId === playerId);
      }
    } else {
      alreadySubmitted = game.images.some(img => img.playerId === playerId);
    }

    if (alreadySubmitted) {
      return res.status(400).json({ error: 'Player has already submitted' });
    }

    // Submit the prompt using the existing logic
    if (game.gameMode === 'PROMPTOPHONE') {
      const numPlayers = game.playerGames.length;
      const playerIndex = game.playerGames.findIndex(p => p.playerId === playerId);
      const chainIndex = (playerIndex + game.currentRound - 1) % numPlayers;
      const promptChain = game.promptChains[chainIndex];
      
      if (!promptChain) {
        return res.status(400).json({ error: 'No prompt chain found for this round' });
      }

      // Create the image submission with a placeholder URL
      const image = await prisma.image.create({
        data: {
          prompt,
          playerId,
          gameId: game.id,
          url: `placeholder-${Date.now()}`,
        },
      });

      // Update the prompt chain for this round
      await prisma.promptChain.update({
        where: { id: promptChain.id },
        data: {
          chain: [...(promptChain.chain as any[]), { playerId, prompt, imageUrl: image.url }],
        },
      });
    } else {
      // Original Prompt Anything logic
      const image = await prisma.image.create({
        data: {
          prompt,
          playerId,
          gameId: game.id,
          url: `placeholder-${Date.now()}`,
        },
      });
    }

    // Get updated game state
    const updatedGame = await prisma.game.findUnique({
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

    if (!updatedGame) {
      throw new Error('Failed to fetch updated game state');
    }

    const response = formatGameResponse(updatedGame);
    res.json(response);
  } catch (error) {
    console.error('Error auto-submitting prompt:', error);
    res.status(500).json({ error: 'Failed to auto-submit prompt' });
  }
});

export default router;