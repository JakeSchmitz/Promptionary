// Mock OpenAI first before any imports
jest.mock('openai', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    images: {
      generate: jest.fn(),
    },
  })),
}));

import request from 'supertest';
import express from 'express';
import imagesRouter from '../../routes/images';
import prisma from '../../db';
import OpenAI from 'openai';

// Create test app
const app = express();
app.use(express.json());
app.use('/', imagesRouter);

// Get the mocked generate function
const mockOpenAI = new OpenAI();
const mockGenerate = mockOpenAI.images.generate as jest.Mock;

// Mock dependencies
jest.mock('../../db', () => ({
  __esModule: true,
  default: {
    game: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    image: {
      findFirst: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  },
}));

describe('Images Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Ensure mockGenerate is reset
    mockGenerate.mockReset();
  });

  describe('POST /:roomId/generate-image - Generate Image', () => {
    it('should generate image successfully', async () => {
      const mockGame = {
        id: 'game-123',
        roomId: 'test-room',
        gameMode: 'PROMPT_ANYTHING',
        playerGames: [
          { playerId: 'player-123', player: { id: 'player-123', name: 'Test' } },
        ],
        promptChains: [],
        images: [],
      };

      const mockExistingImage = {
        id: 'image-123',
        gameId: 'game-123',
        playerId: 'player-123',
        url: 'placeholder-123456',
      };

      const mockGeneratedUrl = 'https://generated-image.com/image.png';

      (prisma.game.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockGame)
        .mockResolvedValueOnce({ 
          ...mockGame, 
          images: [{ ...mockExistingImage, url: mockGeneratedUrl }] 
        });
      (prisma.image.findFirst as jest.Mock).mockResolvedValue(mockExistingImage);
      (prisma.image.update as jest.Mock).mockResolvedValue({
        ...mockExistingImage,
        url: mockGeneratedUrl,
      });
      (prisma.image.count as jest.Mock).mockResolvedValue(1);
      (prisma.game.update as jest.Mock).mockResolvedValue(mockGame);
      mockGenerate.mockResolvedValue({
        data: [{ url: mockGeneratedUrl }],
      });

      const response = await request(app)
        .post('/test-room/generate-image')
        .send({
          prompt: 'A fluffy cat',
          playerId: 'player-123',
        });

      if (response.status !== 200) {
        console.error('Error response:', response.body);
      }
      expect(response.status).toBe(200);
      expect(mockGenerate).toHaveBeenCalledWith({
        model: 'dall-e-3',
        prompt: 'A fluffy cat',
        n: 1,
        size: '1024x1024',
      });
      expect(prisma.image.update).toHaveBeenCalledWith({
        where: { id: 'image-123' },
        data: { url: mockGeneratedUrl },
      });
    });

    it('should return 404 if game not found', async () => {
      (prisma.game.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/nonexistent-room/generate-image')
        .send({
          prompt: 'Test prompt',
          playerId: 'player-123',
        });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Game not found' });
    });

    it('should return 404 if player not in game', async () => {
      const mockGame = {
        id: 'game-123',
        roomId: 'test-room',
        playerGames: [
          { playerId: 'other-player', player: { id: 'other-player', name: 'Other' } },
        ],
      };

      (prisma.game.findUnique as jest.Mock).mockResolvedValue(mockGame);

      const response = await request(app)
        .post('/test-room/generate-image')
        .send({
          prompt: 'Test prompt',
          playerId: 'player-123',
        });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Player not found in game' });
    });

    it('should handle OpenAI API errors', async () => {
      const mockGame = {
        id: 'game-123',
        roomId: 'test-room',
        playerGames: [
          { playerId: 'player-123', player: { id: 'player-123', name: 'Test' } },
        ],
        images: [],
      };

      (prisma.game.findUnique as jest.Mock).mockResolvedValue(mockGame);
      mockGenerate.mockRejectedValue(new Error('OpenAI API error'));

      const response = await request(app)
        .post('/test-room/generate-image')
        .send({
          prompt: 'Test prompt',
          playerId: 'player-123',
        });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to generate image' });
    });

    it('should move to voting phase when all images are generated', async () => {
      const mockGame = {
        id: 'game-123',
        roomId: 'test-room',
        gameMode: 'PROMPT_ANYTHING',
        playerGames: [
          { playerId: 'player-123', player: { id: 'player-123', name: 'Test' } },
          { playerId: 'player-456', player: { id: 'player-456', name: 'Test2' } },
        ],
        images: [],
      };

      const mockExistingImage = {
        id: 'image-123',
        gameId: 'game-123',
        playerId: 'player-123',
        url: 'placeholder-123456',
      };

      (prisma.game.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockGame)
        .mockResolvedValueOnce({ ...mockGame, images: [] });
      (prisma.image.findFirst as jest.Mock).mockResolvedValue(mockExistingImage);
      (prisma.image.update as jest.Mock).mockResolvedValue({
        ...mockExistingImage,
        url: 'https://generated-image.com/image.png',
      });
      (prisma.image.count as jest.Mock).mockResolvedValue(2); // All players have submitted
      (prisma.game.update as jest.Mock).mockResolvedValue({
        ...mockGame,
        phase: 'VOTING',
      });
      mockGenerate.mockResolvedValue({
        data: [{ url: 'https://generated-image.com/image.png' }],
      });

      const response = await request(app)
        .post('/test-room/generate-image')
        .send({
          prompt: 'Test prompt',
          playerId: 'player-123',
        });

      expect(response.status).toBe(200);
      expect(prisma.game.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { roomId: 'test-room' },
          data: expect.objectContaining({
            phase: 'VOTING',
          }),
        })
      );
    });
  });
});