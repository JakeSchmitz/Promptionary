import request from 'supertest';
import express from 'express';
import promptsRouter from '../../routes/prompts';
import prisma from '../../db';

// Create test app
const app = express();
app.use(express.json());
app.use('/', promptsRouter);

// Mock dependencies
jest.mock('../../db', () => ({
  __esModule: true,
  default: {
    game: {
      findUnique: jest.fn(),
    },
    image: {
      create: jest.fn(),
    },
    promptChain: {
      update: jest.fn(),
    },
  },
}));

describe('Prompts Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /:roomId/prompts - Submit Prompt', () => {
    it('should submit prompt successfully for PROMPT_ANYTHING mode', async () => {
      const mockGame = {
        id: 'game-123',
        roomId: 'test-room',
        gameMode: 'PROMPT_ANYTHING',
        phase: 'PROMPT',
        currentWord: 'cat',
        exclusionWords: ['kitten'],
        playerGames: [
          { playerId: 'player-123', player: { id: 'player-123', name: 'Test Player' } }
        ],
        images: [],
        promptChains: [],
        maxRounds: 3,
        currentRound: 1,
      };

      const mockImage = {
        id: 'image-123',
        prompt: 'A fluffy animal',
        playerId: 'player-123',
        gameId: 'game-123',
        url: 'placeholder-123456',
      };

      (prisma.game.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockGame)
        .mockResolvedValueOnce({ ...mockGame, images: [mockImage] });
      (prisma.image.create as jest.Mock).mockResolvedValue(mockImage);

      const response = await request(app)
        .post('/test-room/prompts')
        .send({
          prompt: 'A fluffy animal',
          playerId: 'player-123',
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        roomId: 'test-room',
        gameMode: 'PROMPT_ANYTHING',
      });
      expect(prisma.image.create).toHaveBeenCalledWith({
        data: {
          prompt: 'A fluffy animal',
          playerId: 'player-123',
          gameId: 'game-123',
          url: expect.stringContaining('placeholder-'),
        },
      });
    });

    it('should submit prompt successfully for PROMPTOPHONE mode', async () => {
      const mockGame = {
        id: 'game-123',
        roomId: 'test-room',
        gameMode: 'PROMPTOPHONE',
        currentRound: 1,
        playerGames: [
          { playerId: 'player-123', player: { id: 'player-123', name: 'Player 1' } },
          { playerId: 'player-456', player: { id: 'player-456', name: 'Player 2' } },
        ],
        images: [],
        promptChains: [
          { id: 'chain-1', playerId: 'player-123', originalWord: 'cat', chain: [] },
          { id: 'chain-2', playerId: 'player-456', originalWord: 'dog', chain: [] },
        ],
      };

      const mockImage = {
        id: 'image-123',
        prompt: 'A fluffy animal',
        playerId: 'player-123',
        gameId: 'game-123',
        url: 'placeholder-123456',
      };

      (prisma.game.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockGame)
        .mockResolvedValueOnce({ ...mockGame, images: [mockImage] });
      (prisma.image.create as jest.Mock).mockResolvedValue(mockImage);
      (prisma.promptChain.update as jest.Mock).mockResolvedValue({});

      const response = await request(app)
        .post('/test-room/prompts')
        .send({
          prompt: 'A fluffy animal',
          playerId: 'player-123',
        });

      expect(response.status).toBe(200);
      expect(prisma.promptChain.update).toHaveBeenCalledWith({
        where: { id: 'chain-1' },
        data: {
          chain: [{ playerId: 'player-123', prompt: 'A fluffy animal', imageUrl: 'placeholder-123456' }],
        },
      });
    });

    it('should return 400 if prompt or playerId is missing', async () => {
      const response = await request(app)
        .post('/test-room/prompts')
        .send({
          playerId: 'player-123',
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Prompt and playerId are required' });
    });

    it('should return 404 if game not found', async () => {
      (prisma.game.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/nonexistent-room/prompts')
        .send({
          prompt: 'Test prompt',
          playerId: 'player-123',
        });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Game not found' });
    });

    it('should return 403 if player not in game', async () => {
      const mockGame = {
        id: 'game-123',
        roomId: 'test-room',
        playerGames: [
          { playerId: 'other-player', player: { id: 'other-player', name: 'Other' } }
        ],
      };

      (prisma.game.findUnique as jest.Mock).mockResolvedValue(mockGame);

      const response = await request(app)
        .post('/test-room/prompts')
        .send({
          prompt: 'Test prompt',
          playerId: 'player-123',
        });

      expect(response.status).toBe(403);
      expect(response.body).toEqual({ error: 'Player not in game' });
    });

    it('should prevent duplicate submissions in PROMPT_ANYTHING mode', async () => {
      const mockGame = {
        id: 'game-123',
        roomId: 'test-room',
        gameMode: 'PROMPT_ANYTHING',
        playerGames: [
          { playerId: 'player-123', player: { id: 'player-123', name: 'Test' } }
        ],
        images: [
          { playerId: 'player-123', prompt: 'Existing prompt' }
        ],
      };

      (prisma.game.findUnique as jest.Mock).mockResolvedValue(mockGame);

      const response = await request(app)
        .post('/test-room/prompts')
        .send({
          prompt: 'Another prompt',
          playerId: 'player-123',
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Player has already submitted a prompt' });
    });
  });

  describe('POST /:roomId/auto-submit - Auto Submit Prompt', () => {
    it('should auto-submit prompt successfully', async () => {
      const mockGame = {
        id: 'game-123',
        roomId: 'test-room',
        gameMode: 'PROMPT_ANYTHING',
        phase: 'PROMPT',
        currentWord: 'cat',
        exclusionWords: [],
        playerGames: [
          { playerId: 'player-123', player: { id: 'player-123', name: 'Test' } }
        ],
        images: [],
        promptChains: [],
        maxRounds: 3,
        currentRound: 1,
      };

      const mockImage = {
        id: 'image-123',
        prompt: 'Default prompt',
        playerId: 'player-123',
        gameId: 'game-123',
        url: 'placeholder-123456',
      };

      (prisma.game.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockGame)
        .mockResolvedValueOnce({ ...mockGame, images: [mockImage] });
      (prisma.image.create as jest.Mock).mockResolvedValue(mockImage);

      const response = await request(app)
        .post('/test-room/auto-submit')
        .send({
          prompt: 'Default prompt',
          playerId: 'player-123',
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        roomId: 'test-room',
        gameMode: 'PROMPT_ANYTHING',
      });
    });

    it('should not auto-submit if player already submitted', async () => {
      const mockGame = {
        id: 'game-123',
        roomId: 'test-room',
        gameMode: 'PROMPT_ANYTHING',
        playerGames: [
          { playerId: 'player-123', player: { id: 'player-123', name: 'Test' } }
        ],
        images: [
          { playerId: 'player-123', prompt: 'Already submitted' }
        ],
        promptChains: [],
      };

      (prisma.game.findUnique as jest.Mock).mockResolvedValue(mockGame);

      const response = await request(app)
        .post('/test-room/auto-submit')
        .send({
          prompt: 'Another prompt',
          playerId: 'player-123',
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Player has already submitted' });
    });

    it('should handle PROMPTOPHONE mode auto-submit', async () => {
      const mockGame = {
        id: 'game-123',
        roomId: 'test-room',
        gameMode: 'PROMPTOPHONE',
        currentRound: 1,
        playerGames: [
          { playerId: 'player-123', player: { id: 'player-123', name: 'Player 1' } },
          { playerId: 'player-456', player: { id: 'player-456', name: 'Player 2' } },
        ],
        images: [],
        promptChains: [
          { id: 'chain-1', playerId: 'player-123', originalWord: 'cat', chain: [] },
          { id: 'chain-2', playerId: 'player-456', originalWord: 'dog', chain: [] },
        ],
      };

      const mockImage = {
        id: 'image-123',
        prompt: 'Default prompt',
        playerId: 'player-123',
        gameId: 'game-123',
        url: 'placeholder-123456',
      };

      (prisma.game.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockGame)
        .mockResolvedValueOnce({ ...mockGame, images: [mockImage] });
      (prisma.image.create as jest.Mock).mockResolvedValue(mockImage);
      (prisma.promptChain.update as jest.Mock).mockResolvedValue({});

      const response = await request(app)
        .post('/test-room/auto-submit')
        .send({
          prompt: 'Default prompt',
          playerId: 'player-123',
        });

      expect(response.status).toBe(200);
      expect(prisma.promptChain.update).toHaveBeenCalled();
    });
  });
});