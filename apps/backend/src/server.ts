import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import prisma from './db';
import { gameWords } from './data/words';

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for all routes
app.use(cors({
  origin: 'http://localhost:5173', // Vite's default port
  methods: ['GET', 'POST', 'PATCH'],
  credentials: true
}));

app.use(express.json());

// Log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// OpenAI configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Create a router for all /api routes
const apiRouter = express.Router();

// Game management endpoints
apiRouter.post('/games', async (req, res) => {
  try {
    const { roomId, playerId, playerName } = req.body;
    
    if (!playerName) {
      return res.status(400).json({ error: 'Player name is required' });
    }

    // Create the game and the host player in a transaction
    const game = await prisma.$transaction(async (prisma) => {
      // Create the game first
      const game = await prisma.game.create({
        data: {
          roomId,
          currentWord: gameWords[Math.floor(Math.random() * gameWords.length)].word,
        },
      });

      // Create the host player
      const player = await prisma.player.create({
        data: {
          name: playerName,
          gameId: game.id,
          isHost: true,
          email: playerId, // Store the auth ID in the email field for reference
        },
      });

      // Update the game with the host ID
      await prisma.game.update({
        where: { id: game.id },
        data: { hostId: player.id },
      });

      // Return the full game state
      return prisma.game.findUnique({
        where: { id: game.id },
        include: {
          players: true,
          images: {
            include: {
              player: true,
              votes: true,
            },
          },
        },
      });
    });

    res.json(game);
  } catch (error) {
    console.error('Error creating game:', error);
    res.status(500).json({ error: 'Failed to create game' });
  }
});

apiRouter.get('/games/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const game = await prisma.game.findUnique({
      where: { roomId },
      include: {
        players: true,
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
    res.json(game);
  } catch (error) {
    console.error('Error fetching game:', error);
    res.status(500).json({ error: 'Failed to fetch game' });
  }
});

apiRouter.post('/games/:roomId/players', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { name, playerId } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Player name is required' });
    }

    const game = await prisma.game.findUnique({
      where: { roomId },
      include: {
        players: true,
      },
    });

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Debug log
    console.log(`[JOIN] Attempting to add player: name='${name}', playerId='${playerId}' to roomId='${roomId}'`);

    // Generate a unique ID for the player if not provided
    const finalPlayerId = playerId || `guest-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    // Check if player already exists in the game
    const existingPlayer = game.players.find(p => p.id === finalPlayerId);
    if (existingPlayer) {
      console.log(`[JOIN] Player already exists: id='${finalPlayerId}', name='${name}'`);
      return res.json(game);
    }

    // Create the player and get the updated game state in a transaction
    const updatedGame = await prisma.$transaction(async (tx) => {
      // Create the player
      await tx.player.create({
        data: {
          id: finalPlayerId,
          name,
          gameId: game.id,
          isHost: false,
        },
      });

      // Get the updated game state
      return tx.game.findUnique({
        where: { roomId },
        include: {
          players: true,
          images: {
            include: {
              player: true,
              votes: true,
            },
          },
        },
      });
    });

    if (!updatedGame) {
      throw new Error('Failed to update game state');
    }

    console.log(`[JOIN] Player added: id='${finalPlayerId}', name='${name}'`);
    res.json(updatedGame);
  } catch (error) {
    console.error('Error adding player:', error);
    res.status(500).json({ error: 'Failed to add player' });
  }
});

apiRouter.post('/games/:roomId/start', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { playerId } = req.body; // Get the player ID from the request

    // Get the game and verify the player is the host
    const game = await prisma.game.findUnique({
      where: { roomId },
      include: {
        players: true,
      },
    });

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const host = game.players.find(p => p.isHost);
    if (!host || host.id !== playerId) {
      return res.status(403).json({ error: 'Only the host can start the game' });
    }

    const updatedGame = await prisma.game.update({
      where: { roomId },
      data: {
        phase: 'PROMPT',
        currentWord: gameWords[Math.floor(Math.random() * gameWords.length)].word,
      },
      include: {
        players: true,
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
    console.error('Error starting game:', error);
    res.status(500).json({ error: 'Failed to start game' });
  }
});

// Mount the API router at /api
app.use('/api', apiRouter);

app.post('/games/:roomId/next-round', async (req, res) => {
  try {
    const { roomId } = req.params;
    const game = await prisma.game.findUnique({
      where: { roomId },
    });

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    if (game.currentRound >= game.maxRounds) {
      const updatedGame = await prisma.game.update({
        where: { roomId },
        data: { phase: 'RESULTS' },
      });
      return res.json(updatedGame);
    }

    const updatedGame = await prisma.game.update({
      where: { roomId },
      data: {
        currentRound: game.currentRound + 1,
        phase: 'PROMPT',
        currentWord: gameWords[Math.floor(Math.random() * gameWords.length)].word,
      },
    });
    res.json(updatedGame);
  } catch (error) {
    console.error('Error starting next round:', error);
    res.status(500).json({ error: 'Failed to start next round' });
  }
});

// Image generation endpoint
app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt, roomId, playerId } = req.body;
    console.log('Received image generation request:', { prompt, roomId, playerId });

    // Validate game and player
    const game = await prisma.game.findUnique({
      where: { roomId },
      include: { players: true }
    });

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const player = game.players.find(p => p.id === playerId);
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

    // Save the image to the database
    const image = await prisma.image.create({
      data: {
        url: imageUrl,
        prompt,
        gameId: game.id,
        playerId,
      },
    });

    // Update game phase to voting if all players have submitted images
    const playerCount = game.players.length;
    const imageCount = await prisma.image.count({
      where: { 
        gameId: game.id,
        playerId: { in: game.players.map(p => p.id) }
      },
    });

    if (imageCount >= playerCount) {
      await prisma.game.update({
        where: { roomId },
        data: { phase: 'VOTING' },
      });
    }

    // Return the updated game state
    const updatedGame = await prisma.game.findUnique({
      where: { roomId },
      include: {
        players: true,
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
    console.error('Error generating image:', error);
    res.status(500).json({ error: 'Failed to generate image' });
  }
});

app.post('/api/games/:roomId/vote', async (req, res) => {
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
    const playerCount = await prisma.player.count({
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
      await prisma.player.update({
        where: { id: winningImage.playerId },
        data: { score: { increment: 1 } },
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

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log('Environment:', {
    NODE_ENV: process.env.NODE_ENV,
    PORT: port,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'Set' : 'Not set'
  });
}); 