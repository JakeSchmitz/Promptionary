import { Router } from 'express';
import OpenAI from 'openai';
import prisma from '../db';

const router = Router();

// OpenAI configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Generate image for a prompt
router.post('/:roomId/generate-image', async (req, res) => {
  try {
    const { prompt, playerId } = req.body;
    const { roomId } = req.params;
    console.log('Received image generation request:', { prompt, roomId, playerId });

    // Validate game and player
    const game = await prisma.game.findUnique({
      where: { roomId },
      include: { 
        playerGames: { include: { player: true } },
        promptChains: true,
        images: true
      }
    });

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const player = game.playerGames.find(pg => pg.playerId === playerId);
    if (!player) {
      return res.status(404).json({ error: 'Player not found in game' });
    }

    // Generate image
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1024x1024",
    });

    if (!response.data?.[0]?.url) {
      throw new Error('No image URL in response');
    }

    const imageUrl = response.data[0].url;
    console.log('Generated image URL:', imageUrl);

    // Find and update the existing image entry instead of creating a new one
    const existingImage = await prisma.image.findFirst({
      where: {
        gameId: game.id,
        playerId,
        url: { startsWith: 'placeholder-' }
      }
    });

    if (!existingImage) {
      throw new Error('No placeholder image found to update');
    }

    // Update the existing image with the generated URL
    const updatedImage = await prisma.image.update({
      where: { id: existingImage.id },
      data: { url: imageUrl }
    });

    // Update game phase to voting if all players have submitted images
    const playerCount = game.playerGames.length;
    const imageCount = await prisma.image.count({
      where: { 
        gameId: game.id,
        playerId: { in: game.playerGames.map(pg => pg.playerId) },
        url: { not: { startsWith: 'placeholder-' } }
      },
    });

    if (imageCount >= playerCount) {
      if (game.gameMode === 'PROMPTOPHONE') {
        // For Promptophone, check if we've completed all rounds
        const totalRounds = game.playerGames.length;
        if (game.currentRound >= totalRounds) {
          // Game is complete, move to results
          await prisma.game.update({
            where: { roomId },
            data: { 
              phase: 'RESULTS',
              roundStartTime: new Date(),
            },
          });
        } else {
          // Start the next round automatically
          const nextChainIndex = game.currentRound;
          const nextChain = game.promptChains?.[nextChainIndex];
          
          // Get the last image from the previous round to use as the word for next round
          const lastRoundImages = game.images?.filter((img: any) => 
            img.createdAt > new Date(Date.now() - 60000) // Images from the last minute
          ) || [];
          
          // Use the last generated image URL as the current word for the next round
          const currentWord = lastRoundImages[0]?.url || nextChain?.originalWord || '';

          await prisma.game.update({
            where: { roomId },
            data: {
              currentRound: game.currentRound + 1,
              phase: 'PROMPT',
              currentWord: currentWord,
              roundStartTime: new Date(),
            },
          });
        }
      } else {
        // For Prompt Anything, move to voting phase
        await prisma.game.update({
          where: { roomId },
          data: { 
            phase: 'VOTING',
            roundStartTime: new Date(),
          },
        });
      }
    } else {
      // Keep the game in PROMPT phase until all images are generated
      await prisma.game.update({
        where: { roomId },
        data: { 
          phase: 'PROMPT',
        },
      });
    }

    // Return the updated game state with all images
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
      },
    });

    if (!updatedGame) {
      throw new Error('Failed to fetch updated game state');
    }

    res.json(updatedGame);
  } catch (error) {
    console.error('Error generating image:', error);
    res.status(500).json({ error: 'Failed to generate image' });
  }
});

export default router;