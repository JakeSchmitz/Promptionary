import request from 'supertest';
import express from 'express';
import playersRouter from '../../routes/players';
import prisma from '../../db';

// Create test app
const app = express();
app.use(express.json());
app.use('/', playersRouter);

// Mock dependencies
jest.mock('../../db', () => ({
  __esModule: true,
  default: {
    game: {
      findUnique: jest.fn(),
    },
    player: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    playerGame: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

describe('Players Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /:roomId/players - Add Player to Game', () => {
    it('should add player to game successfully', async () => {
      const mockGame = {
        id: 'game-123',
        roomId: 'test-room',
        playerGames: [],
        images: [],
      };

      const mockUpdatedGame = {
        ...mockGame,
        playerGames: [
          { player: { id: 'player-123', name: 'New Player' } }
        ],
      };

      (prisma.game.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockGame)
        .mockResolvedValueOnce(mockUpdatedGame);
      (prisma.player.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.player.create as jest.Mock).mockResolvedValue({
        id: 'player-123',
        name: 'New Player',
      });
      (prisma.playerGame.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.playerGame.create as jest.Mock).mockResolvedValue({});

      const response = await request(app)
        .post('/test-room/players')
        .send({
          name: 'New Player',
          playerId: 'player-123',
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject(mockUpdatedGame);
      expect(prisma.player.create).toHaveBeenCalledWith({
        data: {
          id: 'player-123',
          name: 'New Player',
        },
      });
    });

    it('should return 400 if player name is missing', async () => {
      const response = await request(app)
        .post('/test-room/players')
        .send({
          playerId: 'player-123',
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Player name is required' });
    });

    it('should return 404 if game not found', async () => {
      (prisma.game.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/nonexistent-room/players')
        .send({
          name: 'New Player',
          playerId: 'player-123',
        });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Game not found' });
    });

    it('should handle existing player', async () => {
      const mockGame = {
        id: 'game-123',
        roomId: 'test-room',
        playerGames: [],
        images: [],
      };

      const mockPlayer = {
        id: 'player-123',
        name: 'Existing Player',
      };

      (prisma.game.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockGame)
        .mockResolvedValueOnce({ ...mockGame, playerGames: [{ player: mockPlayer }] });
      (prisma.player.findUnique as jest.Mock).mockResolvedValue(mockPlayer);
      (prisma.playerGame.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.playerGame.create as jest.Mock).mockResolvedValue({});

      const response = await request(app)
        .post('/test-room/players')
        .send({
          name: 'New Name',
          playerId: 'player-123',
        });

      expect(response.status).toBe(200);
      expect(prisma.player.create).not.toHaveBeenCalled();
    });
  });

  describe('GET /:playerId/games - Get Player Game History', () => {
    it('should return player game history successfully', async () => {
      const mockPlayerGames = [{
        playerId: 'player-123',
        score: 5,
        player: { id: 'player-123', name: 'Test Player' },
        game: {
          id: 'game-123',
          roomId: 'test-room',
          gameMode: 'PROMPT_ANYTHING',
          phase: 'ENDED',
          createdAt: new Date(),
          updatedAt: new Date(),
          currentRound: 3,
          maxRounds: 3,
          currentWord: 'cat',
          exclusionWords: [],
          playerGames: [
            { playerId: 'player-123', score: 5, player: { name: 'Test Player' } },
            { playerId: 'player-456', score: 3, player: { name: 'Other Player' } },
          ],
          images: [],
          promptChains: [],
        },
      }];

      (prisma.playerGame.findMany as jest.Mock).mockResolvedValue(mockPlayerGames);

      const response = await request(app)
        .get('/player-123/games');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject({
        id: 'game-123',
        roomId: 'test-room',
        gameMode: 'PROMPT_ANYTHING',
        status: 'Complete',
        playerScore: 5,
        winner: {
          name: 'Test Player',
          score: 5,
        },
      });
    });

    it('should filter by status', async () => {
      const mockPlayerGames = [
        {
          game: {
            id: 'game-1',
            phase: 'ENDED',
            playerGames: [{ playerId: 'player-123', score: 5, player: { name: 'Test' } }],
            images: [],
            promptChains: [],
          },
        },
        {
          game: {
            id: 'game-2',
            phase: 'PROMPT',
            playerGames: [{ playerId: 'player-123', score: 0, player: { name: 'Test' } }],
            images: [],
            promptChains: [],
          },
        },
      ];

      (prisma.playerGame.findMany as jest.Mock).mockResolvedValue(mockPlayerGames);

      const response = await request(app)
        .get('/player-123/games?status=complete');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].id).toBe('game-1');
    });

    it('should filter by game mode', async () => {
      const mockPlayerGames = [
        {
          game: {
            id: 'game-1',
            gameMode: 'PROMPT_ANYTHING',
            phase: 'ENDED',
            playerGames: [{ playerId: 'player-123', score: 5, player: { name: 'Test' } }],
            images: [],
            promptChains: [],
          },
        },
        {
          game: {
            id: 'game-2',
            gameMode: 'PROMPTOPHONE',
            phase: 'ENDED',
            playerGames: [{ playerId: 'player-123', score: 0, player: { name: 'Test' } }],
            images: [],
            promptChains: [],
          },
        },
      ];

      (prisma.playerGame.findMany as jest.Mock).mockResolvedValue(mockPlayerGames);

      const response = await request(app)
        .get('/player-123/games?gameMode=PROMPTOPHONE');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].id).toBe('game-2');
    });

    it('should handle errors gracefully', async () => {
      (prisma.playerGame.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/player-123/games');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to fetch game history' });
    });
  });
});