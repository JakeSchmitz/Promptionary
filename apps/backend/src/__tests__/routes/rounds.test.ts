import request from 'supertest';
import express from 'express';
import roundsRouter from '../../routes/rounds';
import prisma from '../../db';

// Create test app
const app = express();
app.use(express.json());
app.use('/', roundsRouter);

// Mock dependencies
jest.mock('../../db', () => ({
  __esModule: true,
  default: {
    game: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe('Rounds Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /:roomId/round/status - Check Round Status', () => {
    it('should return round status for PROMPT_ANYTHING mode', async () => {
      const mockGame = {
        id: 'game-123',
        roomId: 'test-room',
        gameMode: 'PROMPT_ANYTHING',
        roundStartTime: new Date(Date.now() - 30000), // 30 seconds ago
        playerGames: [
          { playerId: 'player-123', player: { id: 'player-123', name: 'Player 1' } },
          { playerId: 'player-456', player: { id: 'player-456', name: 'Player 2' } },
        ],
        images: [
          { playerId: 'player-123', id: 'image-1' }, // Player 1 submitted
        ],
        promptChains: [],
      };

      (prisma.game.findUnique as jest.Mock).mockResolvedValue(mockGame);

      const response = await request(app)
        .get('/test-room/round/status?playerId=player-123');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        allPlayersSubmitted: false,
        hasSubmitted: true,
        timeRemaining: 30, // 60 - 30 = 30 seconds
        shouldEndRound: false,
      });
    });

    it('should return round status for PROMPTOPHONE mode', async () => {
      const mockGame = {
        id: 'game-123',
        roomId: 'test-room',
        gameMode: 'PROMPTOPHONE',
        currentRound: 1,
        roundStartTime: new Date(Date.now() - 10000), // 10 seconds ago
        playerGames: [
          { playerId: 'player-123', player: { id: 'player-123', name: 'Player 1' } },
          { playerId: 'player-456', player: { id: 'player-456', name: 'Player 2' } },
        ],
        images: [],
        promptChains: [
          { id: 'chain-1', playerId: 'player-123', chain: [{ playerId: 'player-123', prompt: 'test' }] },
          { id: 'chain-2', playerId: 'player-456', chain: [] },
        ],
      };

      (prisma.game.findUnique as jest.Mock).mockResolvedValue(mockGame);

      const response = await request(app)
        .get('/test-room/round/status?playerId=player-123');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        allPlayersSubmitted: false,
        hasSubmitted: true,
        timeRemaining: 50, // 60 - 10 = 50 seconds
        shouldEndRound: false,
      });
    });

    it('should indicate when all players have submitted', async () => {
      const mockGame = {
        id: 'game-123',
        roomId: 'test-room',
        gameMode: 'PROMPT_ANYTHING',
        roundStartTime: new Date(),
        playerGames: [
          { playerId: 'player-123', player: { id: 'player-123', name: 'Player 1' } },
          { playerId: 'player-456', player: { id: 'player-456', name: 'Player 2' } },
        ],
        images: [
          { playerId: 'player-123', id: 'image-1' },
          { playerId: 'player-456', id: 'image-2' },
        ],
        promptChains: [],
      };

      (prisma.game.findUnique as jest.Mock).mockResolvedValue(mockGame);

      const response = await request(app)
        .get('/test-room/round/status');

      expect(response.status).toBe(200);
      expect(response.body.allPlayersSubmitted).toBe(true);
      expect(response.body.shouldEndRound).toBe(true);
    });

    it('should indicate when time has expired', async () => {
      const mockGame = {
        id: 'game-123',
        roomId: 'test-room',
        gameMode: 'PROMPT_ANYTHING',
        roundStartTime: new Date(Date.now() - 70000), // 70 seconds ago
        playerGames: [
          { playerId: 'player-123', player: { id: 'player-123', name: 'Player 1' } },
        ],
        images: [],
        promptChains: [],
      };

      (prisma.game.findUnique as jest.Mock).mockResolvedValue(mockGame);

      const response = await request(app)
        .get('/test-room/round/status');

      expect(response.status).toBe(200);
      expect(response.body.timeRemaining).toBe(0);
      expect(response.body.shouldEndRound).toBe(true);
    });
  });

  describe('POST /:roomId/end-round - End Current Round', () => {
    it('should move to voting phase for PROMPT_ANYTHING', async () => {
      const mockGame = {
        id: 'game-123',
        roomId: 'test-room',
        gameMode: 'PROMPT_ANYTHING',
        currentRound: 1,
        playerGames: [
          { playerId: 'player-123', player: { id: 'player-123', name: 'Player 1' } },
        ],
        images: [],
        promptChains: [],
      };

      const mockUpdatedGame = {
        ...mockGame,
        phase: 'VOTING',
      };

      (prisma.game.findUnique as jest.Mock).mockResolvedValue(mockGame);
      (prisma.game.update as jest.Mock).mockResolvedValue(mockUpdatedGame);

      const response = await request(app)
        .post('/test-room/end-round');

      expect(response.status).toBe(200);
      expect(response.body.phase).toBe('VOTING');
      expect(prisma.game.update).toHaveBeenCalledWith({
        where: { roomId: 'test-room' },
        data: {
          phase: 'VOTING',
          roundStartTime: expect.any(Date),
        },
        include: expect.any(Object),
      });
    });

    it('should move to results phase for PROMPTOPHONE when all rounds complete', async () => {
      const mockGame = {
        id: 'game-123',
        roomId: 'test-room',
        gameMode: 'PROMPTOPHONE',
        currentRound: 2, // Last round with 2 players
        playerGames: [
          { playerId: 'player-123', player: { id: 'player-123', name: 'Player 1' } },
          { playerId: 'player-456', player: { id: 'player-456', name: 'Player 2' } },
        ],
        images: [],
        promptChains: [],
      };

      const mockUpdatedGame = {
        ...mockGame,
        phase: 'RESULTS',
      };

      (prisma.game.findUnique as jest.Mock).mockResolvedValue(mockGame);
      (prisma.game.update as jest.Mock).mockResolvedValue(mockUpdatedGame);

      const response = await request(app)
        .post('/test-room/end-round');

      expect(response.status).toBe(200);
      expect(response.body.phase).toBe('RESULTS');
    });

    it('should start next round for PROMPTOPHONE when rounds remain', async () => {
      const mockGame = {
        id: 'game-123',
        roomId: 'test-room',
        gameMode: 'PROMPTOPHONE',
        currentRound: 1,
        playerGames: [
          { playerId: 'player-123', player: { id: 'player-123', name: 'Player 1' } },
          { playerId: 'player-456', player: { id: 'player-456', name: 'Player 2' } },
        ],
        images: [
          { url: 'https://image1.png', createdAt: new Date() },
        ],
        promptChains: [
          { originalWord: 'cat' },
          { originalWord: 'dog' },
        ],
      };

      const mockUpdatedGame = {
        ...mockGame,
        currentRound: 2,
        phase: 'PROMPT',
        currentWord: 'https://image1.png',
      };

      (prisma.game.findUnique as jest.Mock).mockResolvedValue(mockGame);
      (prisma.game.update as jest.Mock).mockResolvedValue(mockUpdatedGame);

      const response = await request(app)
        .post('/test-room/end-round');

      expect(response.status).toBe(200);
      expect(response.body.currentRound).toBe(2);
      expect(response.body.phase).toBe('PROMPT');
    });
  });

  describe('POST /:roomId/next-round - Start Next Round', () => {
    it('should start next round successfully', async () => {
      const mockGame = {
        id: 'game-123',
        roomId: 'test-room',
        gameMode: 'PROMPT_ANYTHING',
        currentRound: 1,
        maxRounds: 3,
        playerGames: [
          { playerId: 'host-123', isHost: true, player: { id: 'host-123', name: 'Host' } },
        ],
        promptChains: [],
        images: [],
      };

      const mockUpdatedGame = {
        ...mockGame,
        currentRound: 2,
        phase: 'PROMPT',
        currentWord: 'mountain',
        exclusionWords: ['hill', 'peak', 'climb'],
      };

      (prisma.game.findUnique as jest.Mock).mockResolvedValue(mockGame);
      (prisma.game.update as jest.Mock).mockResolvedValue(mockUpdatedGame);

      const response = await request(app)
        .post('/test-room/next-round')
        .send({ playerId: 'host-123' });

      expect(response.status).toBe(200);
      expect(response.body.currentRound).toBe(2);
      expect(response.body.phase).toBe('PROMPT');
    });

    it('should return 403 if player is not host', async () => {
      const mockGame = {
        id: 'game-123',
        roomId: 'test-room',
        playerGames: [
          { playerId: 'host-123', isHost: true, player: { id: 'host-123', name: 'Host' } },
          { playerId: 'player-456', isHost: false, player: { id: 'player-456', name: 'Player' } },
        ],
      };

      (prisma.game.findUnique as jest.Mock).mockResolvedValue(mockGame);

      const response = await request(app)
        .post('/test-room/next-round')
        .send({ playerId: 'player-456' });

      expect(response.status).toBe(403);
      expect(response.body).toEqual({ error: 'Only the host can start the next round' });
    });

    it('should end game when max rounds reached', async () => {
      const mockGame = {
        id: 'game-123',
        roomId: 'test-room',
        gameMode: 'PROMPT_ANYTHING',
        currentRound: 3,
        maxRounds: 3,
        playerGames: [
          { playerId: 'host-123', isHost: true, player: { id: 'host-123', name: 'Host' } },
        ],
        promptChains: [],
        images: [],
      };

      const mockUpdatedGame = {
        ...mockGame,
        phase: 'RESULTS',
      };

      (prisma.game.findUnique as jest.Mock).mockResolvedValue(mockGame);
      (prisma.game.update as jest.Mock).mockResolvedValue(mockUpdatedGame);

      const response = await request(app)
        .post('/test-room/next-round')
        .send({ playerId: 'host-123' });

      expect(response.status).toBe(200);
      expect(response.body.phase).toBe('RESULTS');
    });

    it('should handle PROMPTOPHONE next round logic', async () => {
      const mockGame = {
        id: 'game-123',
        roomId: 'test-room',
        gameMode: 'PROMPTOPHONE',
        currentRound: 1,
        playerGames: [
          { playerId: 'host-123', isHost: true, player: { id: 'host-123', name: 'Host' } },
          { playerId: 'player-456', isHost: false, player: { id: 'player-456', name: 'Player' } },
        ],
        promptChains: [
          { originalWord: 'cat' },
          { originalWord: 'dog' },
        ],
        images: [
          { url: 'https://previous-image.png', createdAt: new Date() },
        ],
      };

      const mockUpdatedGame = {
        ...mockGame,
        currentRound: 2,
        phase: 'PROMPT',
        currentWord: 'https://previous-image.png',
      };

      (prisma.game.findUnique as jest.Mock).mockResolvedValue(mockGame);
      (prisma.game.update as jest.Mock).mockResolvedValue(mockUpdatedGame);

      const response = await request(app)
        .post('/test-room/next-round')
        .send({ playerId: 'host-123' });

      expect(response.status).toBe(200);
      expect(response.body.currentWord).toBe('https://previous-image.png');
    });
  });
});