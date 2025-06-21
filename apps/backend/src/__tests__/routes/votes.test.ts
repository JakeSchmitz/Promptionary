import request from 'supertest';
import express from 'express';
import votesRouter from '../../routes/votes';
import prisma from '../../db';

// Create test app
const app = express();
app.use(express.json());
app.use('/', votesRouter);

// Mock dependencies
jest.mock('../../db', () => ({
  __esModule: true,
  default: {
    game: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    vote: {
      create: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    playerGame: {
      count: jest.fn(),
      updateMany: jest.fn(),
    },
    image: {
      findMany: jest.fn(),
    },
  },
}));

describe('Votes Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /:roomId/votes - Submit Vote', () => {
    it('should submit vote successfully', async () => {
      const mockGame = {
        id: 'game-123',
        roomId: 'test-room',
        playerGames: [
          { playerId: 'player-123', player: { id: 'player-123', name: 'Voter' } },
          { playerId: 'player-456', player: { id: 'player-456', name: 'Other' } },
        ],
        images: [
          { id: 'image-1', playerId: 'player-456' },
        ],
        votes: [],
      };

      const mockVote = {
        id: 'vote-123',
        gameId: 'game-123',
        imageId: 'image-1',
        voterId: 'player-123',
      };

      const mockUpdatedGame = {
        ...mockGame,
        votes: [mockVote],
        images: [
          { 
            id: 'image-1', 
            playerId: 'player-456',
            player: { id: 'player-456', name: 'Other' },
            votes: [mockVote]
          },
        ],
      };

      (prisma.game.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockGame)
        .mockResolvedValueOnce(mockUpdatedGame);
      (prisma.vote.create as jest.Mock).mockResolvedValue(mockVote);
      (prisma.playerGame.count as jest.Mock).mockResolvedValue(2);
      (prisma.vote.count as jest.Mock).mockResolvedValue(1);

      const response = await request(app)
        .post('/test-room/votes')
        .send({
          imageId: 'image-1',
          voterId: 'player-123',
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject(mockUpdatedGame);
      expect(prisma.vote.create).toHaveBeenCalledWith({
        data: {
          gameId: 'game-123',
          imageId: 'image-1',
          voterId: 'player-123',
        },
      });
    });

    it('should return 400 if imageId or voterId missing', async () => {
      const response = await request(app)
        .post('/test-room/votes')
        .send({
          voterId: 'player-123',
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Image ID and voter ID are required' });
    });

    it('should return 404 if game not found', async () => {
      (prisma.game.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/nonexistent-room/votes')
        .send({
          imageId: 'image-1',
          voterId: 'player-123',
        });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Game not found' });
    });

    it('should return 403 if voter not in game', async () => {
      const mockGame = {
        id: 'game-123',
        roomId: 'test-room',
        playerGames: [
          { playerId: 'other-player', player: { id: 'other-player', name: 'Other' } },
        ],
        votes: [],
      };

      (prisma.game.findUnique as jest.Mock).mockResolvedValue(mockGame);

      const response = await request(app)
        .post('/test-room/votes')
        .send({
          imageId: 'image-1',
          voterId: 'player-123',
        });

      expect(response.status).toBe(403);
      expect(response.body).toEqual({ error: 'Voter not in game' });
    });

    it('should replace existing vote', async () => {
      const existingVote = {
        id: 'existing-vote',
        voterId: 'player-123',
        imageId: 'old-image',
      };

      const mockGame = {
        id: 'game-123',
        roomId: 'test-room',
        playerGames: [
          { playerId: 'player-123', player: { id: 'player-123', name: 'Voter' } },
        ],
        votes: [existingVote],
      };

      (prisma.game.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockGame)
        .mockResolvedValueOnce({ ...mockGame, votes: [] });
      (prisma.vote.delete as jest.Mock).mockResolvedValue(existingVote);
      (prisma.vote.create as jest.Mock).mockResolvedValue({
        id: 'new-vote',
        gameId: 'game-123',
        imageId: 'new-image',
        voterId: 'player-123',
      });

      const response = await request(app)
        .post('/test-room/votes')
        .send({
          imageId: 'new-image',
          voterId: 'player-123',
        });

      expect(response.status).toBe(200);
      expect(prisma.vote.delete).toHaveBeenCalledWith({
        where: { id: 'existing-vote' },
      });
    });
  });

  describe('GET /:roomId/votes/status - Check Voting Status', () => {
    it('should return voting status successfully', async () => {
      const mockGame = {
        id: 'game-123',
        roomId: 'test-room',
        roundStartTime: new Date(Date.now() - 10000), // 10 seconds ago
        playerGames: [
          { playerId: 'player-123', player: { id: 'player-123', name: 'Player 1' } },
          { playerId: 'player-456', player: { id: 'player-456', name: 'Player 2' } },
        ],
        votes: [
          { voterId: 'player-123', imageId: 'image-1' },
        ],
      };

      (prisma.game.findUnique as jest.Mock).mockResolvedValue(mockGame);

      const response = await request(app)
        .get('/test-room/votes/status?voterId=player-123');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        allPlayersVoted: false,
        hasVoted: true,
        timeRemaining: expect.any(Number),
        shouldEndRound: false,
      });
    });

    it('should indicate all players voted', async () => {
      const mockGame = {
        id: 'game-123',
        roomId: 'test-room',
        roundStartTime: new Date(),
        playerGames: [
          { playerId: 'player-123', player: { id: 'player-123', name: 'Player 1' } },
          { playerId: 'player-456', player: { id: 'player-456', name: 'Player 2' } },
        ],
        votes: [
          { voterId: 'player-123', imageId: 'image-1' },
          { voterId: 'player-456', imageId: 'image-2' },
        ],
      };

      (prisma.game.findUnique as jest.Mock).mockResolvedValue(mockGame);

      const response = await request(app)
        .get('/test-room/votes/status');

      expect(response.status).toBe(200);
      expect(response.body.allPlayersVoted).toBe(true);
    });
  });

  describe('POST /:roomId/end-voting - End Voting Round', () => {
    it('should end voting and calculate scores', async () => {
      const mockGame = {
        id: 'game-123',
        roomId: 'test-room',
        playerGames: [
          { playerId: 'player-123', player: { id: 'player-123', name: 'Player 1' } },
          { playerId: 'player-456', player: { id: 'player-456', name: 'Player 2' } },
        ],
        images: [
          { 
            id: 'image-1', 
            playerId: 'player-123',
            votes: [{ id: 'vote-1' }, { id: 'vote-2' }] // 2 votes
          },
          { 
            id: 'image-2', 
            playerId: 'player-456',
            votes: [{ id: 'vote-3' }] // 1 vote
          },
        ],
      };

      const mockUpdatedGame = {
        ...mockGame,
        phase: 'RESULTS',
      };

      (prisma.game.findUnique as jest.Mock).mockResolvedValue(mockGame);
      (prisma.playerGame.updateMany as jest.Mock).mockResolvedValue({});
      (prisma.game.update as jest.Mock).mockResolvedValue(mockUpdatedGame);

      const response = await request(app)
        .post('/test-room/end-voting');

      expect(response.status).toBe(200);
      expect(response.body.phase).toBe('RESULTS');
      
      // Verify score updates
      expect(prisma.playerGame.updateMany).toHaveBeenCalledWith({
        where: { playerId: 'player-123', gameId: 'game-123' },
        data: { score: { increment: 2 } },
      });
      expect(prisma.playerGame.updateMany).toHaveBeenCalledWith({
        where: { playerId: 'player-456', gameId: 'game-123' },
        data: { score: { increment: 1 } },
      });
    });

    it('should return 404 if game not found', async () => {
      (prisma.game.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/nonexistent-room/end-voting');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Game not found' });
    });

    it('should handle games with no votes', async () => {
      const mockGame = {
        id: 'game-123',
        roomId: 'test-room',
        playerGames: [
          { playerId: 'player-123', player: { id: 'player-123', name: 'Player 1' } },
        ],
        images: [
          { id: 'image-1', playerId: 'player-123', votes: [] },
        ],
      };

      (prisma.game.findUnique as jest.Mock).mockResolvedValue(mockGame);
      (prisma.playerGame.updateMany as jest.Mock).mockResolvedValue({});
      (prisma.game.update as jest.Mock).mockResolvedValue({
        ...mockGame,
        phase: 'RESULTS',
      });

      const response = await request(app)
        .post('/test-room/end-voting');

      expect(response.status).toBe(200);
      expect(prisma.playerGame.updateMany).toHaveBeenCalledWith({
        where: { playerId: 'player-123', gameId: 'game-123' },
        data: { score: { increment: 0 } },
      });
    });
  });
});