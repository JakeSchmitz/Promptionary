import { Router } from 'express';
import prisma from '../db';

const router = Router();

// Add player to a game
router.post('/:roomId/players', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { name, playerId } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Player name is required' });
    }

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
      },
    });

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Create or find the player
    let player = await prisma.player.findUnique({
      where: { id: playerId }
    });
    if (!player) {
      player = await prisma.player.create({
        data: {
          id: playerId,
          name,
        },
      });
    }

    // Create PlayerGame association if not already present
    const existingPG = await prisma.playerGame.findUnique({
      where: { playerId_gameId: { playerId: player.id, gameId: game.id } }
    });
    if (!existingPG) {
      await prisma.playerGame.create({
        data: {
          playerId: player.id,
          gameId: game.id,
          isHost: false,
        },
      });
    }

    // Get the updated game state
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
      throw new Error('Failed to update game state');
    }

    res.json(updatedGame);
  } catch (error) {
    console.error('Error adding player:', error);
    res.status(500).json({ error: 'Failed to add player' });
  }
});

// Get player's game history
router.get('/:playerId/games', async (req, res) => {
  try {
    const { playerId } = req.params;
    const { status, gameMode, includeIncomplete } = req.query;
    console.log('Fetching game history for player:', playerId, 'with filters:', { status, gameMode, includeIncomplete });

    // Find all PlayerGame records for this player
    const playerGames = await prisma.playerGame.findMany({
      where: { playerId },
      include: {
        game: {
          include: {
            playerGames: { include: { player: true } },
            images: { include: { player: true, votes: true } },
            promptChains: true,
          },
        },
      },
      orderBy: { game: { createdAt: 'desc' } },
    });

    // Filter by status and gameMode if provided
    let games = playerGames.map(pg => pg.game);
    if (status === 'complete') {
      games = games.filter((g: any) => g.phase === 'ENDED');
    } else if (status === 'in-progress') {
      games = games.filter((g: any) => g.phase !== 'ENDED');
    }
    if (gameMode) {
      games = games.filter((g: any) => g.gameMode === gameMode);
    }

    // Transform the data to include game summary information
    const gameHistory = games.map((game: any) => {
      const playerInGame = (game as any).playerGames.find((pg: any) => pg.playerId === playerId);
      const winner = (game as any).playerGames.reduce((prev: any, current: any) =>
        current.score > prev.score ? current : prev
      );
      const status = game.phase === 'ENDED' ? 'Complete' : 'In Progress';

      return {
        id: game.id,
        roomId: game.roomId,
        gameMode: game.gameMode,
        createdAt: game.createdAt,
        updatedAt: game.updatedAt,
        playerCount: (game as any).playerGames.length,
        playerScore: playerInGame?.score || 0,
        playerName: playerInGame?.player.name || 'Unknown',
        winner: {
          name: winner.player.name,
          score: winner.score
        },
        totalImages: (game as any).images.length,
        hasPromptChains: (game as any).promptChains.length > 0,
        status,
        phase: game.phase, // Include the actual phase for debugging
        // Include full data for detailed view
        fullGameData: {
          playerGames: (game as any).playerGames,
          images: (game as any).images,
          promptChains: (game as any).promptChains,
          currentRound: game.currentRound,
          maxRounds: game.maxRounds,
          currentWord: game.currentWord,
          exclusionWords: game.exclusionWords
        }
      };
    });

    res.json(gameHistory);
  } catch (error) {
    console.error('Error fetching game history:', error);
    res.status(500).json({ error: 'Failed to fetch game history' });
  }
});

export default router;