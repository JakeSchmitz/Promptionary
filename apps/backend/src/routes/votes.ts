import { Router } from 'express';
import prisma from '../db';
import { VOTING_DURATION } from '../utils/game-utils';

const router = Router();

// Submit a vote
router.post('/:roomId/votes', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { imageId, voterId } = req.body;

    if (!imageId || !voterId) {
      return res.status(400).json({ error: 'Image ID and voter ID are required' });
    }

    const game = await prisma.game.findUnique({
      where: { roomId },
      include: {
        playerGames: { include: { player: true } },
        images: true,
        votes: true,
      },
    });

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Verify the voter is in the game
    const voter = game.playerGames.find(pg => pg.playerId === voterId);
    if (!voter) {
      return res.status(403).json({ error: 'Voter not in game' });
    }

    // Check if voter has already voted and delete their previous vote if they have
    const existingVote = game.votes.find(v => v.voterId === voterId);
    if (existingVote) {
      await prisma.vote.delete({
        where: { id: existingVote.id },
      });
    }

    // Create the new vote
    const vote = await prisma.vote.create({
      data: {
        gameId: game.id,
        imageId,
        voterId,
      },
    });

    // Check if all players have voted
    const playerCount = await prisma.playerGame.count({
      where: { gameId: game.id },
    });

    const voteCount = await prisma.vote.count({
      where: { gameId: game.id },
    });

    // If all players have voted, move to results phase
    if (voteCount >= playerCount) {
      await prisma.game.update({
        where: { roomId },
        data: { phase: 'RESULTS' },
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
      },
    });

    if (!updatedGame) {
      throw new Error('Failed to fetch updated game state');
    }

    res.json(updatedGame);
  } catch (error) {
    console.error('Error submitting vote:', error);
    res.status(500).json({ error: 'Failed to submit vote' });
  }
});

// Legacy voting endpoint (for backward compatibility)
router.post('/:roomId/vote', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { imageId, voterId } = req.body;

    const game = await prisma.game.findUnique({
      where: { roomId },
    });

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const vote = await prisma.vote.create({
      data: {
        gameId: game.id,
        imageId,
        voterId,
      },
    });

    // Check if all players have voted
    const playerCount = await prisma.playerGame.count({
      where: { gameId: game.id },
    });

    const voteCount = await prisma.vote.count({
      where: { gameId: game.id },
    });

    if (voteCount >= playerCount - 1) {
      // Find the winning image
      const images = await prisma.image.findMany({
        where: { gameId: game.id },
        include: { votes: true },
      });

      const winningImage = images.reduce((prev: typeof images[0], current: typeof images[0]) => 
        (current.votes.length > prev.votes.length) ? current : prev
      );

      // Update the winning player's score
      await prisma.playerGame.updateMany({
        where: { 
          playerId: winningImage.playerId,
          gameId: game.id
        },
        data: {
          score: {
            increment: 1,
          },
        },
      });

      // Update game phase to results
      await prisma.game.update({
        where: { roomId },
        data: { phase: 'RESULTS' },
      });
    }

    res.json(vote);
  } catch (error) {
    console.error('Error submitting vote:', error);
    res.status(500).json({ error: 'Failed to submit vote' });
  }
});

// Check voting status
router.get('/:roomId/votes/status', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { voterId } = req.query;

    const game = await prisma.game.findUnique({
      where: { roomId },
      include: {
        playerGames: { include: { player: true } },
        votes: true,
      },
    });

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const allPlayersVoted = game.playerGames.every(pg => 
      game.votes.some(vote => vote.voterId === pg.playerId)
    );

    const hasVoted = voterId ? game.votes.some(vote => vote.voterId === voterId as string) : false;

    const roundStartTime = game.roundStartTime;
    const now = new Date();
    const timeElapsed = roundStartTime ? (now.getTime() - roundStartTime.getTime()) / 1000 : 0;
    const timeRemaining = Math.max(0, Math.ceil(VOTING_DURATION - timeElapsed));

    res.json({
      allPlayersVoted,
      hasVoted,
      timeRemaining,
      shouldEndRound: allPlayersVoted || timeRemaining <= 0,
    });
  } catch (error) {
    console.error('Error checking voting status:', error);
    res.status(500).json({ error: 'Failed to check voting status' });
  }
});

// End voting round
router.post('/:roomId/end-voting', async (req, res) => {
  try {
    const { roomId } = req.params;

    const game = await prisma.game.findUnique({
      where: { roomId },
      include: {
        playerGames: { include: { player: true } },
        images: {
          include: {
            votes: true,
          },
        },
      },
    });

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Calculate scores for this round
    const imageScores = game.images.map(image => ({
      imageId: image.id,
      playerId: image.playerId,
      score: image.votes.length,
    }));

    // Update player scores
    for (const score of imageScores) {
      await prisma.playerGame.updateMany({
        where: { 
          playerId: score.playerId,
          gameId: game.id
        },
        data: {
          score: {
            increment: score.score,
          },
        },
      });
    }

    // Move to results phase
    const updatedGame = await prisma.game.update({
      where: { roomId },
      data: {
        phase: 'RESULTS',
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

    res.json(updatedGame);
  } catch (error) {
    console.error('Error ending voting:', error);
    res.status(500).json({ error: 'Failed to end voting' });
  }
});

export default router;