import request from 'supertest';
import express from 'express';
import gamesRouter from '../../routes/games';
import prisma from '../../db';

// Create test app
const app = express();
app.use(express.json());
app.use('/games', gamesRouter);

// Mock dependencies
jest.mock('../../db', () => ({
  __esModule: true,
  default: {
    $transaction: jest.fn(),
    game: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    player: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    playerGame: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    promptChain: {
      create: jest.fn(),
    },
  },
}));

jest.mock('../../data/words', () => ({
  gameWords: [
    { word: 'cat', exclusionWords: ['kitten', 'feline', 'pet'] },
    { word: 'dog', exclusionWords: ['puppy', 'canine', 'bark'] },
    { word: 'mountain', exclusionWords: ['hill', 'peak', 'climb'] },
  ],
}));

describe('Games Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /games - Create Game', () => {
    it('should create a new game successfully', async () => {
      const mockGame = {
        id: 'game-123',
        roomId: 'test-room',
        gameMode: 'PROMPT_ANYTHING',
        currentWord: 'cat',
        phase: 'LOBBY',
        playerGames: [{ player: { id: 'player-123', name: 'Test Player' } }],
        images: [],
        promptChains: [],
      };

      (prisma.$transaction as jest.Mock).mockResolvedValue(mockGame);

      const response = await request(app)
        .post('/games')
        .send({
          roomId: 'test-room',
          playerId: 'player-123',
          playerName: 'Test Player',
          gameMode: 'PROMPT_ANYTHING',
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        gameMode: 'PROMPT_ANYTHING',
      });
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should return 400 if player name is missing', async () => {
      const response = await request(app)
        .post('/games')
        .send({
          roomId: 'test-room',
          playerId: 'player-123',
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Player name is required' });
    });

    it('should handle transaction errors', async () => {
      (prisma.$transaction as jest.Mock).mockRejectedValue(new Error('Transaction failed'));

      const response = await request(app)
        .post('/games')
        .send({
          roomId: 'test-room',
          playerId: 'player-123',
          playerName: 'Test Player',
        });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to create game' });
    });
  });

  describe('GET /games/:roomId - Get Game', () => {
    it('should return game state successfully', async () => {
      const mockGame = {
        id: 'game-123',
        roomId: 'test-room',
        gameMode: 'PROMPT_ANYTHING',
        phase: 'PROMPT',
        currentRound: 1,
        currentWord: 'cat',
        exclusionWords: [],
        playerGames: [{ player: { id: 'player-123', name: 'Test Player' } }],
        images: [],
        promptChains: [],
        maxRounds: 3,
      };

      (prisma.game.findUnique as jest.Mock).mockResolvedValue(mockGame);

      const response = await request(app)
        .get('/games/test-room');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        roomId: 'test-room',
        gameMode: 'PROMPT_ANYTHING',
      });
      expect(prisma.game.findUnique).toHaveBeenCalledWith({
        where: { roomId: 'test-room' },
        include: expect.any(Object),
      });
    });

    it('should return 404 if game not found', async () => {
      (prisma.game.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/games/nonexistent-room');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Game not found' });
    });
  });

  describe('POST /games/:roomId/start - Start Game', () => {
    it('should start PROMPT_ANYTHING game successfully', async () => {
      const mockGame = {
        id: 'game-123',
        roomId: 'test-room',
        gameMode: 'PROMPT_ANYTHING',
        playerGames: [{ 
          playerId: 'host-123', 
          isHost: true,
          player: { id: 'host-123', name: 'Host Player' } 
        }],
        promptChains: [],
      };

      const mockUpdatedGame = {
        ...mockGame,
        phase: 'PROMPT',
        currentRound: 1,
        currentWord: 'cat',
        exclusionWords: ['kitten', 'feline', 'pet'],
        images: [],
      };

      (prisma.game.findUnique as jest.Mock).mockResolvedValue(mockGame);
      (prisma.game.update as jest.Mock).mockResolvedValue(mockUpdatedGame);

      const response = await request(app)
        .post('/games/test-room/start')
        .send({ playerId: 'host-123' });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        gameMode: 'PROMPT_ANYTHING',
      });
      expect(prisma.game.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { roomId: 'test-room' },
        data: expect.objectContaining({
          phase: 'PROMPT',
          currentRound: 1,
          gameMode: 'PROMPT_ANYTHING',
        }),
      }));
    });

    it('should start PROMPTOPHONE game successfully', async () => {
      const mockGame = {
        id: 'game-123',
        roomId: 'test-room',
        gameMode: 'PROMPTOPHONE',
        playerGames: [
          { playerId: 'host-123', isHost: true, player: { id: 'host-123', name: 'Host' } },
          { playerId: 'player-2', isHost: false, player: { id: 'player-2', name: 'Player 2' } },
        ],
        promptChains: [],
      };

      (prisma.game.findUnique as jest.Mock).mockResolvedValue(mockGame);
      (prisma.promptChain.create as jest.Mock).mockImplementation((data) => 
        Promise.resolve({ 
          id: `chain-${Math.random()}`, 
          ...data.data,
          playerId: data.data.playerId,
          originalWord: data.data.originalWord,
        })
      );
      (prisma.game.update as jest.Mock).mockResolvedValue({
        ...mockGame,
        phase: 'PROMPT',
        currentRound: 1,
        promptChains: [],
        images: [],
      });

      const response = await request(app)
        .post('/games/test-room/start')
        .send({ playerId: 'host-123' });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        gameMode: 'PROMPTOPHONE',
      });
      expect(prisma.promptChain.create).toHaveBeenCalledTimes(2);
    });

    it('should return 403 if player is not host', async () => {
      const mockGame = {
        id: 'game-123',
        roomId: 'test-room',
        playerGames: [{ 
          playerId: 'host-123', 
          isHost: true,
          player: { id: 'host-123', name: 'Host Player' } 
        }],
      };

      (prisma.game.findUnique as jest.Mock).mockResolvedValue(mockGame);

      const response = await request(app)
        .post('/games/test-room/start')
        .send({ playerId: 'non-host-123' });

      expect(response.status).toBe(403);
      expect(response.body).toEqual({ error: 'Only the host can start the game' });
    });

    it('should return 404 if game not found', async () => {
      (prisma.game.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/games/nonexistent-room/start')
        .send({ playerId: 'player-123' });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Game not found' });
    });
  });
});