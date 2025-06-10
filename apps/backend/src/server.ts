import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import prisma from './db';
import { gameWords } from './data/words';

const app = express();
const port = process.env.PORT || 3000;

// Constants
const ROUND_DURATION = 60; // 60 seconds per round

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

// Example targets for testing
const EXAMPLE_TARGETS = [
  {
    word: 'cat',
    exclusionWords: ['kitten', 'feline', 'pet', 'animal', 'meow']
  },
  {
    word: 'mountain',
    exclusionWords: ['hill', 'peak', 'climb', 'rock', 'summit']
  },
  {
    word: 'ocean',
    exclusionWords: ['sea', 'water', 'beach', 'wave', 'fish']
  },
  {
    word: 'forest',
    exclusionWords: ['tree', 'wood', 'nature', 'green', 'leaf']
  },
  {
    word: 'castle',
    exclusionWords: ['fortress', 'palace', 'kingdom', 'royal', 'medieval']
  }
];

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
          currentRound: 0,
          maxRounds: 3, // Set default number of rounds
          phase: 'LOBBY',
        },
      });

      // Check if player already exists
      let player = await prisma.player.findUnique({
        where: { id: playerId }
      });

      // Only create the player if they don't exist
      if (!player) {
        player = await prisma.player.create({
          data: {
            id: playerId,
            name: playerName,
            email: playerId, // Store the auth ID in the email field for reference
            gameId: game.id,
            isHost: true,
          },
        });
      } else {
        // Add the player to the game
        await prisma.player.update({
          where: { id: playerId },
          data: {
            gameId: game.id,
            isHost: true,
          },
        });
      }

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

    // Use upsert to handle both create and update cases
    const updatedGame = await prisma.$transaction(async (tx) => {
      // Upsert the player
      await tx.player.upsert({
        where: { id: finalPlayerId },
        update: {
          name,
          gameId: game.id,
          isHost: false,
        },
        create: {
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

    console.log(`[JOIN] Player added/updated: id='${finalPlayerId}', name='${name}'`);
    res.json(updatedGame);
  } catch (error) {
    console.error('Error adding player:', error);
    res.status(500).json({ error: 'Failed to add player' });
  }
});

// Update the start game endpoint to set the round start time
apiRouter.post('/games/:roomId/start', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { playerId } = req.body;

    // Get random target
    const randomTarget = EXAMPLE_TARGETS[Math.floor(Math.random() * EXAMPLE_TARGETS.length)];

    // First get the game to verify the host
    const existingGame = await prisma.game.findUnique({
      where: { roomId },
      include: {
        players: true,
      },
    });

    if (!existingGame) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Verify the player is the host
    const host = existingGame.players.find(p => p.isHost);
    if (!host || host.id !== playerId) {
      return res.status(403).json({ error: 'Only the host can start the game' });
    }

    // Update the game with the new target and phase
    const updatedGame = await prisma.game.update({
      where: { roomId },
      data: {
        phase: 'PROMPT',
        currentRound: 1,
        currentWord: randomTarget.word,
        exclusionWords: randomTarget.exclusionWords,
        roundStartTime: new Date(),
      },
      include: {
        players: true,
      },
    });

    res.json(updatedGame);
  } catch (error) {
    console.error('Error starting game:', error);
    res.status(500).json({ error: 'Failed to start game' });
  }
});

// Add endpoint to check if all players have submitted
apiRouter.get('/games/:roomId/submissions/status', async (req, res) => {
  try {
    const { roomId } = req.params;

    const game = await prisma.game.findUnique({
      where: { roomId },
      include: {
        players: true,
        images: true,
      },
    });

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const allPlayersSubmitted = game.players.every(player => 
      game.images.some(image => image.playerId === player.id)
    );

    const roundStartTime = game.roundStartTime;
    const now = new Date();
    const timeElapsed = roundStartTime ? (now.getTime() - roundStartTime.getTime()) / 1000 : 0;
    const timeRemaining = Math.max(0, Math.ceil(ROUND_DURATION - timeElapsed));

    res.json({
      allPlayersSubmitted,
      timeRemaining,
      shouldEndRound: allPlayersSubmitted || timeRemaining <= 0,
    });
  } catch (error) {
    console.error('Error checking submission status:', error);
    res.status(500).json({ error: 'Failed to check submission status' });
  }
});

// Add endpoint to end the current round
apiRouter.post('/games/:roomId/end-round', async (req, res) => {
  try {
    const { roomId } = req.params;

    const game = await prisma.game.findUnique({
      where: { roomId },
      include: {
        players: true,
        images: true,
      },
    });

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Move to voting phase
    const updatedGame = await prisma.game.update({
      where: { roomId },
      data: {
        phase: 'VOTING',
      },
      include: {
        players: true,
        images: true,
      },
    });

    res.json(updatedGame);
  } catch (error) {
    console.error('Error ending round:', error);
    res.status(500).json({ error: 'Failed to end round' });
  }
});

// Add prompt submission endpoint
apiRouter.post('/games/:roomId/prompts', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { prompt, playerId } = req.body;

    if (!prompt || !playerId) {
      return res.status(400).json({ error: 'Prompt and playerId are required' });
    }

    const game = await prisma.game.findUnique({
      where: { roomId },
      include: {
        players: true,
        images: true,
      },
    });

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Verify the player is in the game
    const player = game.players.find(p => p.id === playerId);
    if (!player) {
      return res.status(403).json({ error: 'Player not in game' });
    }

    // Check if player has already submitted
    const existingSubmission = game.images.find(img => img.playerId === playerId);
    if (existingSubmission) {
      return res.status(400).json({ error: 'Player has already submitted a prompt' });
    }

    // Create the image submission with a placeholder URL
    const image = await prisma.image.create({
      data: {
        prompt,
        playerId,
        gameId: game.id,
        url: `placeholder-${Date.now()}`, // Placeholder URL until we generate the actual image
      },
    });

    // Get updated game state
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

    if (!updatedGame) {
      throw new Error('Failed to fetch updated game state');
    }

    res.json(updatedGame);
  } catch (error) {
    console.error('Error submitting prompt:', error);
    res.status(500).json({ error: 'Failed to submit prompt' });
  }
});

// Add voting endpoints
apiRouter.post('/games/:roomId/votes', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { imageId, voterId } = req.body;

    if (!imageId || !voterId) {
      return res.status(400).json({ error: 'Image ID and voter ID are required' });
    }

    const game = await prisma.game.findUnique({
      where: { roomId },
      include: {
        players: true,
        images: true,
        votes: true,
      },
    });

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Verify the voter is in the game
    const voter = game.players.find(p => p.id === voterId);
    if (!voter) {
      return res.status(403).json({ error: 'Voter not in game' });
    }

    // Check if voter has already voted
    const existingVote = game.votes.find(v => v.voterId === voterId);
    if (existingVote) {
      return res.status(400).json({ error: 'Player has already voted' });
    }

    // Create the vote
    const vote = await prisma.vote.create({
      data: {
        gameId: game.id,
        imageId,
        voterId,
      },
    });

    // Get updated game state
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

    if (!updatedGame) {
      throw new Error('Failed to fetch updated game state');
    }

    res.json(updatedGame);
  } catch (error) {
    console.error('Error submitting vote:', error);
    res.status(500).json({ error: 'Failed to submit vote' });
  }
});

apiRouter.get('/games/:roomId/votes/status', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { voterId } = req.query;

    const game = await prisma.game.findUnique({
      where: { roomId },
      include: {
        players: true,
        votes: true,
      },
    });

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const allPlayersVoted = game.players.every(player => 
      game.votes.some(vote => vote.voterId === player.id)
    );

    const hasVoted = voterId ? game.votes.some(vote => vote.voterId === voterId) : false;

    const roundStartTime = game.roundStartTime;
    const now = new Date();
    const timeElapsed = roundStartTime ? (now.getTime() - roundStartTime.getTime()) / 1000 : 0;
    const timeRemaining = Math.max(0, Math.ceil(30 - timeElapsed)); // 30 seconds for voting

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

apiRouter.post('/games/:roomId/end-voting', async (req, res) => {
  try {
    const { roomId } = req.params;

    const game = await prisma.game.findUnique({
      where: { roomId },
      include: {
        players: true,
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
      await prisma.player.update({
        where: { id: score.playerId },
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
    console.error('Error ending voting:', error);
    res.status(500).json({ error: 'Failed to end voting' });
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
      // Set round start time for voting phase
      await prisma.game.update({
        where: { roomId },
        data: { 
          phase: 'VOTING',
          roundStartTime: new Date(),
        },
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