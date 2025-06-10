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
    const { roomId, playerId, playerName, gameMode } = req.body;
    
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
          gameMode: gameMode || 'PROMPT_ANYTHING', // Default to PROMPT_ANYTHING if not specified
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
          promptChains: true,
        },
      });
    });

    // Ensure the game mode is included in the response
    const response = {
      ...game,
      gameMode: game.gameMode || 'PROMPT_ANYTHING',
    };

    res.json(response);
  } catch (error) {
    console.error('Error creating game:', error);
    res.status(500).json({ error: 'Failed to create game' });
  }
});

apiRouter.get('/games/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    console.log('Fetching game state for room:', roomId);

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
        promptChains: true,
      },
    });

    if (!game) {
      console.log('Game not found for room:', roomId);
      return res.status(404).json({ error: 'Game not found' });
    }

    console.log('Game state retrieved:', {
      gameMode: game.gameMode,
      phase: game.phase,
      currentRound: game.currentRound,
      playerCount: game.players.length,
      promptChainCount: game.promptChains?.length
    });

    // Get the current word's exclusion words if we're in a prompt phase
    let exclusionWords = game.exclusionWords || [];
    if (game.phase === 'PROMPT' && game.currentWord) {
      const wordData = gameWords.find(w => w.word.toLowerCase() === game.currentWord?.toLowerCase());
      if (wordData) {
        exclusionWords = wordData.exclusionWords;
      }
    }

    const response = {
      id: game.id,
      roomId: game.roomId,
      players: game.players,
      currentRound: game.currentRound,
      maxRounds: game.maxRounds,
      currentWord: game.currentWord,
      exclusionWords,
      rounds: [], // TODO: Populate rounds if needed
      isComplete: game.phase === 'ENDED',
      phase: game.phase,
      images: game.images,
      gameMode: game.gameMode,
      promptChains: game.promptChains,
    };

    console.log('Sending response:', {
      gameMode: response.gameMode,
      phase: response.phase,
      currentRound: response.currentRound
    });

    res.json(response);
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

// Update the start game endpoint
apiRouter.post('/games/:roomId/start', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { playerId } = req.body;

    console.log('Starting game for room:', roomId, 'playerId:', playerId);

    const game = await prisma.game.findUnique({
      where: { roomId },
      include: { 
        players: true,
        promptChains: true,
      }
    });

    if (!game) {
      console.log('Game not found for room:', roomId);
      return res.status(404).json({ error: 'Game not found' });
    }

    // Verify the player is the host
    const host = game.players.find(p => p.isHost);
    if (!host || host.id !== playerId) {
      console.log('Player is not host:', { playerId, hostId: host?.id });
      return res.status(403).json({ error: 'Only the host can start the game' });
    }

    // Get the game mode from the game state
    const gameMode = game.gameMode || 'PROMPT_ANYTHING';
    console.log('Starting game with mode:', {
      gameMode,
      currentGameMode: game.gameMode,
      roomId,
      playerCount: game.players.length,
      players: game.players.map(p => ({ id: p.id, name: p.name, isHost: p.isHost }))
    });

    if (gameMode === 'PROMPTOPHONE') {
      try {
        // For Promptophone, create a prompt chain for each player with unique words
        // Shuffle the words array to get random unique words
        const shuffledWords = [...gameWords]
          .sort(() => Math.random() - 0.5)
          .slice(0, game.players.length);

        console.log('Creating prompt chains for Promptophone:', {
          playerCount: game.players.length,
          wordCount: shuffledWords.length,
          words: shuffledWords.map(w => w.word)
        });

        // Create a prompt chain for each player with a unique word
        const promptChains = await Promise.all(
          game.players.map(async (player, index) => {
            const word = shuffledWords[index];
            console.log(`Creating chain for player ${player.name} with word: ${word.word}`);
            return prisma.promptChain.create({
              data: {
                gameId: game.id,
                playerId: player.id, // Associate the chain with the specific player
                originalWord: word.word,
                chain: [], // Initialize empty chain
              },
            });
          })
        );

        // Get the first player's chain to start with
        const firstPlayerChain = promptChains[0];
        console.log('Starting with first player chain:', {
          playerId: firstPlayerChain.playerId,
          word: firstPlayerChain.originalWord
        });

        // Set the first word for the first round
        const updatedGame = await prisma.game.update({
          where: { roomId },
          data: {
            phase: 'PROMPT',
            currentRound: 1,
            currentWord: firstPlayerChain.originalWord,
            exclusionWords: shuffledWords[0].exclusionWords,
            roundStartTime: new Date(),
            gameMode: 'PROMPTOPHONE', // Explicitly set the game mode
          },
          include: {
            players: true,
            images: {
              include: {
                player: true,
                votes: true,
              },
            },
            promptChains: true,
          },
        });

        // Log the updated game state
        console.log('Updated game state for Promptophone:', {
          phase: updatedGame.phase,
          gameMode: updatedGame.gameMode,
          currentRound: updatedGame.currentRound,
          currentWord: updatedGame.currentWord,
          promptChainCount: updatedGame.promptChains?.length,
          chains: updatedGame.promptChains?.map(chain => ({
            playerId: chain.playerId,
            word: chain.originalWord
          }))
        });

        // Ensure game mode is included in the response
        const response = {
          ...updatedGame,
          gameMode: 'PROMPTOPHONE',
        };

        res.json(response);
      } catch (error) {
        console.error('Error in Promptophone game start:', error);
        throw error;
      }
    } else {
      // Original Prompt Anything logic
      try {
        const randomWord = gameWords[Math.floor(Math.random() * gameWords.length)];
        const updatedGame = await prisma.game.update({
          where: { roomId },
          data: {
            phase: 'PROMPT',
            currentRound: 1,
            currentWord: randomWord.word,
            exclusionWords: randomWord.exclusionWords,
            roundStartTime: new Date(),
            gameMode: 'PROMPT_ANYTHING', // Explicitly set the game mode
          },
          include: {
            players: true,
            images: {
              include: {
                player: true,
                votes: true,
              },
            },
            promptChains: true,
          },
        });

        console.log('Updated game state for Prompt Anything:', {
          phase: updatedGame.phase,
          gameMode: updatedGame.gameMode,
          currentRound: updatedGame.currentRound,
          currentWord: updatedGame.currentWord
        });

        // Ensure game mode is included in the response
        const response = {
          ...updatedGame,
          gameMode: 'PROMPT_ANYTHING',
        };

        res.json(response);
      } catch (error) {
        console.error('Error in Prompt Anything game start:', error);
        throw error;
      }
    }
  } catch (error) {
    console.error('Error starting game:', error);
    res.status(500).json({ error: 'Failed to start game' });
  }
});

// Add endpoint to check submission status
apiRouter.get('/games/:roomId/round/status', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { playerId } = req.query;

    const game = await prisma.game.findUnique({
      where: { roomId },
      include: {
        players: true,
        images: {
          include: {
            player: true,
          },
        },
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
        roundStartTime: new Date(),
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
    console.error('Error ending round:', error);
    res.status(500).json({ error: 'Failed to end round' });
  }
});

// Update the prompt submission endpoint
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
        promptChains: true,
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

    if (game.gameMode === 'PROMPTOPHONE') {
      // For Promptophone, find the appropriate prompt chain for this player
      const promptChain = game.promptChains.find(chain => chain.playerId === playerId);
      
      if (!promptChain) {
        console.error('No prompt chain found for player:', {
          playerId,
          availableChains: game.promptChains?.map(c => ({
            playerId: c.playerId,
            word: c.originalWord
          }))
        });
        return res.status(400).json({ error: 'No prompt chain found for current player' });
      }

      console.log('Found prompt chain for player:', {
        playerId,
        originalWord: promptChain.originalWord,
        chainLength: (promptChain.chain as any[]).length,
        currentRound: game.currentRound
      });

      // Create the image submission with a placeholder URL
      const image = await prisma.image.create({
        data: {
          prompt,
          playerId,
          gameId: game.id,
          url: `placeholder-${Date.now()}`, // Placeholder URL until we generate the actual image
        },
      });

      // Update the prompt chain
      await prisma.promptChain.update({
        where: { id: promptChain.id },
        data: {
          chain: [...(promptChain.chain as any[]), { playerId, prompt, imageUrl: image.url }],
        },
      });
    } else {
      // Original Prompt Anything logic
      const image = await prisma.image.create({
        data: {
          prompt,
          playerId,
          gameId: game.id,
          url: `placeholder-${Date.now()}`, // Placeholder URL until we generate the actual image
        },
      });
    }

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
        promptChains: true,
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
    const allPlayersVoted = game.players.every(player => 
      game.votes.some(vote => vote.voterId === player.id)
    );

    // If all players have voted, move to results phase
    if (allPlayersVoted) {
      await prisma.game.update({
        where: { roomId },
        data: { phase: 'RESULTS' },
      });
    }

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

// Update the next round endpoint
apiRouter.post('/games/:roomId/next-round', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { playerId } = req.body;

    const game = await prisma.game.findUnique({
      where: { roomId },
      include: { 
        players: true,
        promptChains: true,
        images: {
          include: {
            player: true,
          },
        },
      }
    });

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Verify the player is the host
    const host = game.players.find(p => p.isHost);
    if (!host || host.id !== playerId) {
      return res.status(403).json({ error: 'Only the host can start the next round' });
    }

    if (game.gameMode === 'PROMPTOPHONE') {
      // For Promptophone, check if we've completed all rounds
      const totalRounds = game.players.length;
      if (game.currentRound >= totalRounds) {
        const updatedGame = await prisma.game.update({
          where: { roomId },
          data: { phase: 'RESULTS' },
          include: {
            players: true,
            images: {
              include: {
                player: true,
                votes: true,
              },
            },
            promptChains: true,
          },
        });
        return res.json(updatedGame);
      }

      // Find the next prompt chain to work on
      const nextChainIndex = game.currentRound;
      const nextChain = game.promptChains[nextChainIndex];
      
      // Get the last image from the previous round
      const lastRoundImages = game.images.filter(img => 
        img.createdAt > new Date(Date.now() - 60000) // Images from the last minute
      );
      
      // If this is the first round, use the original word
      // Otherwise, use the last generated image
      const currentWord = game.currentRound === 1 
        ? nextChain.originalWord 
        : lastRoundImages[0]?.url || nextChain.originalWord;

      // Move to next round
      const updatedGame = await prisma.game.update({
        where: { roomId },
        data: {
          currentRound: game.currentRound + 1,
          phase: 'PROMPT',
          currentWord: currentWord,
          roundStartTime: new Date(),
        },
        include: {
          players: true,
          images: {
            include: {
              player: true,
              votes: true,
            },
          },
          promptChains: true,
        },
      });

      res.json(updatedGame);
    } else {
      // Original Prompt Anything logic
      if (game.currentRound >= game.maxRounds) {
        const updatedGame = await prisma.game.update({
          where: { roomId },
          data: { phase: 'RESULTS' },
          include: {
            players: true,
            images: {
              include: {
                player: true,
                votes: true,
              },
            },
            promptChains: true,
          },
        });
        return res.json(updatedGame);
      }

      // Get a random word with its exclusion words
      const randomWord = gameWords[Math.floor(Math.random() * gameWords.length)];

      const updatedGame = await prisma.game.update({
        where: { roomId },
        data: {
          currentRound: game.currentRound + 1,
          phase: 'PROMPT',
          currentWord: randomWord.word,
          exclusionWords: randomWord.exclusionWords,
          roundStartTime: new Date(),
        },
        include: {
          players: true,
          images: {
            include: {
              player: true,
              votes: true,
            },
          },
          promptChains: true,
        },
      });

      res.json(updatedGame);
    }
  } catch (error) {
    console.error('Error starting next round:', error);
    res.status(500).json({ error: 'Failed to start next round' });
  }
});

// Image generation endpoint
apiRouter.post('/games/:roomId/generate-image', async (req, res) => {
  try {
    const { prompt, playerId } = req.body;
    const { roomId } = req.params;
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

    // Find and update the existing image entry instead of creating a new one
    const existingImage = await prisma.image.findFirst({
      where: {
        gameId: game.id,
        playerId,
        url: { startsWith: 'placeholder-' }
      }
    });

    if (!existingImage) {
      throw new Error('No placeholder image found to update');
    }

    // Update the existing image with the generated URL
    const updatedImage = await prisma.image.update({
      where: { id: existingImage.id },
      data: { url: imageUrl }
    });

    // Update game phase to voting if all players have submitted images
    const playerCount = game.players.length;
    const imageCount = await prisma.image.count({
      where: { 
        gameId: game.id,
        playerId: { in: game.players.map(p => p.id) },
        url: { not: { startsWith: 'placeholder-' } }
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
    } else {
      // Keep the game in PROMPT phase until all images are generated
      await prisma.game.update({
        where: { roomId },
        data: { 
          phase: 'PROMPT',
        },
      });
    }

    // Return the updated game state with all images
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