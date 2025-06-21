import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import prisma from './db';
import { gameWords } from './data/words';
import path from 'path';

const app = express();
const port = process.env.PORT || 3000;

// Constants
const ROUND_DURATION = 60; // 60 seconds per round

// Enable CORS for all routes
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:8080'], // Allow both Vite dev server and Docker setup
  methods: ['GET', 'POST', 'PATCH'],
  credentials: true
}));

app.use(express.json());

// Serve static files from the React app build directory (for production)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../frontend/dist')));
}

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

      // Create or find the player
      let player = await prisma.player.findUnique({
        where: { id: playerId }
      });
      if (!player) {
        player = await prisma.player.create({
          data: {
            id: playerId,
            name: playerName,
            email: playerId, // Store the auth ID in the email field for reference
          },
        });
      }

      // Create PlayerGame association for host if not already present
      const existingPG = await prisma.playerGame.findUnique({
        where: { playerId_gameId: { playerId: player.id, gameId: game.id } }
      });
      if (!existingPG) {
        await prisma.playerGame.create({
          data: {
            playerId: player.id,
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
          playerGames: { include: { player: true } },
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
      gameMode: game?.gameMode || 'PROMPT_ANYTHING',
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
        playerGames: { include: { player: true } },
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
      playerCount: game.playerGames.length,
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
      players: game.playerGames.map(pg => pg.player),
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
        playerGames: { include: { player: true } },
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

    // Create or find the player
    let player = await prisma.player.findUnique({
      where: { id: playerId }
    });
    if (!player) {
      player = await prisma.player.create({
        data: {
          id: playerId,
          name,
        },
      });
    }

    // Create PlayerGame association if not already present
    const existingPG = await prisma.playerGame.findUnique({
      where: { playerId_gameId: { playerId: player.id, gameId: game.id } }
    });
    if (!existingPG) {
      await prisma.playerGame.create({
        data: {
          playerId: player.id,
          gameId: game.id,
          isHost: false,
        },
      });
    }

    // Get the updated game state
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
      throw new Error('Failed to update game state');
    }

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
        playerGames: { include: { player: true } },
        promptChains: true,
      }
    });

    if (!game) {
      console.log('Game not found for room:', roomId);
      return res.status(404).json({ error: 'Game not found' });
    }

    // Verify the player is the host
    const host = game.playerGames.find(pg => pg.isHost);
    if (!host || host.playerId !== playerId) {
      console.log('Player is not host:', { playerId, hostId: host?.playerId });
      return res.status(403).json({ error: 'Only the host can start the game' });
    }

    // Get the game mode from the game state
    const gameMode = game.gameMode || 'PROMPT_ANYTHING';
    console.log('Starting game with mode:', {
      gameMode,
      currentGameMode: game.gameMode,
      roomId,
      playerCount: game.playerGames.length,
      players: game.playerGames.map(pg => ({ playerId: pg.playerId, name: pg.player.name, isHost: pg.isHost }))
    });

    if (gameMode === 'PROMPTOPHONE') {
      try {
        // For Promptophone, create a prompt chain for each player with unique words
        // Shuffle the words array to get random unique words
        const shuffledWords = [...gameWords]
          .sort(() => Math.random() - 0.5)
          .slice(0, game.playerGames.length);

        console.log('Creating prompt chains for Promptophone:', {
          playerCount: game.playerGames.length,
          wordCount: shuffledWords.length,
          words: shuffledWords.map(w => w.word)
        });

        // Create a prompt chain for each player with a unique word
        const promptChains = await Promise.all(
          game.playerGames.map(async (pg, index) => {
            const word = shuffledWords[index];
            console.log(`Creating chain for player ${pg.player.name} with word: ${word.word}`);
            return prisma.promptChain.create({
              data: {
                gameId: game.id,
                playerId: pg.playerId, // Associate the chain with the specific player
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
            playerGames: { include: { player: true } },
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
            playerGames: { include: { player: true } },
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
    const { playerId, gameMode } = req.query;

    const game = await prisma.game.findUnique({
      where: { roomId },
      include: {
        playerGames: { include: { player: true } },
        images: {
          include: {
            player: true,
          },
        },
        promptChains: true,
      },
    });

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    let allPlayersSubmitted = false;
    let hasSubmitted = false;

    if (game.gameMode === 'PROMPTOPHONE') {
      // For Promptophone, check if each player has submitted for their assigned chain in this round
      allPlayersSubmitted = game.playerGames.every(pg => {
        const numPlayers = game.playerGames.length;
        const playerIndex = game.playerGames.findIndex(p => p.playerId === pg.playerId);
        const chainIndex = (playerIndex + game.currentRound - 1) % numPlayers;
        const promptChain = game.promptChains[chainIndex];
        
        if (!promptChain) return false;
        
        // Check if this player has submitted for this round/chain
        return (promptChain.chain as any[]).some((entry: any) => entry.playerId === pg.playerId);
      });

      // Check if the specific player has submitted
      if (playerId) {
        const playerIndex = game.playerGames.findIndex(p => p.playerId === playerId);
        const chainIndex = (playerIndex + game.currentRound - 1) % game.playerGames.length;
        const promptChain = game.promptChains[chainIndex];
        
        if (promptChain) {
          hasSubmitted = (promptChain.chain as any[]).some((entry: any) => entry.playerId === playerId);
        }
      }
    } else {
      // For Prompt Anything, check if all players have submitted images
      allPlayersSubmitted = game.playerGames.every(pg => 
        game.images.some(image => image.playerId === pg.playerId)
      );

      // Check if the specific player has submitted
      if (playerId) {
        hasSubmitted = game.images.some(image => image.playerId === playerId);
      }
    }

    const roundStartTime = game.roundStartTime;
    const now = new Date();
    const timeElapsed = roundStartTime ? (now.getTime() - roundStartTime.getTime()) / 1000 : 0;
    const timeRemaining = Math.max(0, Math.ceil(ROUND_DURATION - timeElapsed));

    res.json({
      allPlayersSubmitted,
      hasSubmitted,
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
        playerGames: { include: { player: true } },
        images: true,
        promptChains: true,
      },
    });

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    if (game.gameMode === 'PROMPTOPHONE') {
      // For Promptophone, check if we've completed all rounds
      const totalRounds = game.playerGames.length;
      if (game.currentRound >= totalRounds) {
        // Game is complete, move to results
        const updatedGame = await prisma.game.update({
          where: { roomId },
          data: { 
            phase: 'RESULTS',
            roundStartTime: new Date(),
          },
          include: {
            playerGames: { include: { player: true } },
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
      } else {
        // Start the next round automatically
        const nextChainIndex = game.currentRound;
        const nextChain = game.promptChains[nextChainIndex];
        
        // Get the last image from the previous round to use as the word for next round
        const lastRoundImages = game.images.filter((img: any) => 
          img.createdAt > new Date(Date.now() - 60000) // Images from the last minute
        );
        
        // Use the last generated image URL as the current word for the next round
        const currentWord = lastRoundImages[0]?.url || nextChain?.originalWord || '';

        const updatedGame = await prisma.game.update({
          where: { roomId },
          data: {
            currentRound: game.currentRound + 1,
            phase: 'PROMPT',
            currentWord: currentWord,
            roundStartTime: new Date(),
          },
          include: {
            playerGames: { include: { player: true } },
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
    } else {
      // For Prompt Anything, move to voting phase
      const updatedGame = await prisma.game.update({
        where: { roomId },
        data: {
          phase: 'VOTING',
          roundStartTime: new Date(),
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
      return res.json(updatedGame);
    }
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
        playerGames: { include: { player: true } },
        images: true,
        promptChains: true,
      },
    });

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Verify the player is in the game
    const player = game.playerGames.find(pg => pg.playerId === playerId);
    if (!player) {
      return res.status(403).json({ error: 'Player not in game' });
    }

    // --- PHASE & SUBMISSION LOGIC ---
    // For PROMPT_ANYTHING, a player can only submit once per game/round
    // For PROMPTOPHONE, a player can submit once per round/chain (handled below)
    if (game.gameMode !== 'PROMPTOPHONE') {
      // For Prompt Anything, block if player already submitted
      const existingSubmission = game.images.find(img => img.playerId === playerId);
      if (existingSubmission) {
        return res.status(400).json({ error: 'Player has already submitted a prompt' });
      }
    }

    if (game.gameMode === 'PROMPTOPHONE') {
      // --- ROUND-BASED CHAIN ASSIGNMENT LOGIC ---
      // Each player is assigned a different chain each round, rotating through all chains
      // Players should be able to submit once per round/chain
      const numPlayers = game.playerGames.length;
      const playerIndex = game.playerGames.findIndex(p => p.playerId === playerId);
      const chainIndex = (playerIndex + game.currentRound - 1) % numPlayers;
      const promptChain = game.promptChains[chainIndex];
      
      if (!promptChain) {
        console.error('No prompt chain found for round-based assignment:', {
          playerId,
          playerIndex,
          chainIndex,
          availableChains: game.promptChains?.map((c, idx) => ({ idx, playerId: c.playerId, word: c.originalWord }))
        });
        return res.status(400).json({ error: 'No prompt chain found for this round' });
      }

      // Prevent duplicate submissions for this round/chain by this player
      const alreadySubmitted = (promptChain.chain as any[]).some((entry: any) => entry.playerId === playerId);
      if (alreadySubmitted) {
        return res.status(400).json({ error: 'Player has already submitted a prompt for this round' });
      }

      // Create the image submission with a placeholder URL
      const image = await prisma.image.create({
        data: {
          prompt,
          playerId,
          gameId: game.id,
          url: `placeholder-${Date.now()}`,
        },
      });

      // Update the prompt chain for this round
      await prisma.promptChain.update({
        where: { id: promptChain.id },
        data: {
          chain: [...(promptChain.chain as any[]), { playerId, prompt, imageUrl: image.url }],
        },
      });
    } else {
      // Original Prompt Anything logic
      // Each player submits a prompt for the round
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
        playerGames: { include: { player: true } },
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

    // Build response to match GET /games/:roomId
    const _game = updatedGame as any;
    let exclusionWords = _game.exclusionWords || [];
    if (_game.phase === 'PROMPT' && _game.currentWord) {
      const wordData = gameWords.find(w => w.word.toLowerCase() === _game.currentWord?.toLowerCase());
      if (wordData) {
        exclusionWords = wordData.exclusionWords;
      }
    }

    const response = {
      id: _game.id,
      roomId: _game.roomId,
      players: _game.playerGames.map((pg: any) => pg.player),
      currentRound: _game.currentRound,
      maxRounds: _game.maxRounds,
      currentWord: _game.currentWord,
      exclusionWords,
      rounds: [], // TODO: Populate rounds if needed
      isComplete: _game.phase === 'ENDED',
      phase: _game.phase,
      images: _game.images,
      gameMode: _game.gameMode,
      promptChains: _game.promptChains,
    };

    res.json(response);
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

apiRouter.get('/games/:roomId/votes/status', async (req, res) => {
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
        playerGames: { include: { player: true } },
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
    const host = game.playerGames.find(pg => pg.isHost);
    if (!host || host.playerId !== playerId) {
      return res.status(403).json({ error: 'Only the host can start the next round' });
    }

    if (game.gameMode === 'PROMPTOPHONE') {
      // For Promptophone, check if we've completed all rounds
      const totalRounds = game.playerGames.length;
      if (game.currentRound >= totalRounds) {
        const updatedGame = await prisma.game.update({
          where: { roomId },
          data: { 
            phase: 'RESULTS',
            roundStartTime: new Date(),
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
          playerGames: { include: { player: true } },
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
            playerGames: { include: { player: true } },
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
          playerGames: { include: { player: true } },
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
      include: { 
        playerGames: { include: { player: true } },
        promptChains: true,
        images: true
      }
    });

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const player = game.playerGames.find(pg => pg.playerId === playerId);
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
    const playerCount = game.playerGames.length;
    const imageCount = await prisma.image.count({
      where: { 
        gameId: game.id,
        playerId: { in: game.playerGames.map(pg => pg.playerId) },
        url: { not: { startsWith: 'placeholder-' } }
      },
    });

    if (imageCount >= playerCount) {
      if (game.gameMode === 'PROMPTOPHONE') {
        // For Promptophone, check if we've completed all rounds
        const totalRounds = game.playerGames.length;
        if (game.currentRound >= totalRounds) {
          // Game is complete, move to results
          await prisma.game.update({
            where: { roomId },
            data: { 
              phase: 'RESULTS',
              roundStartTime: new Date(),
            },
          });
        } else {
          // Start the next round automatically
          const nextChainIndex = game.currentRound;
          const nextChain = game.promptChains?.[nextChainIndex];
          
          // Get the last image from the previous round to use as the word for next round
          const lastRoundImages = game.images?.filter((img: any) => 
            img.createdAt > new Date(Date.now() - 60000) // Images from the last minute
          ) || [];
          
          // Use the last generated image URL as the current word for the next round
          const currentWord = lastRoundImages[0]?.url || nextChain?.originalWord || '';

          await prisma.game.update({
            where: { roomId },
            data: {
              currentRound: game.currentRound + 1,
              phase: 'PROMPT',
              currentWord: currentWord,
              roundStartTime: new Date(),
            },
          });
        }
      } else {
        // For Prompt Anything, move to voting phase
        await prisma.game.update({
          where: { roomId },
          data: { 
            phase: 'VOTING',
            roundStartTime: new Date(),
          },
        });
      }
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

// Game history endpoint
apiRouter.get('/players/:playerId/games', async (req, res) => {
  try {
    const { playerId } = req.params;
    const { status, gameMode, includeIncomplete } = req.query;
    console.log('Fetching game history for player:', playerId, 'with filters:', { status, gameMode, includeIncomplete });

    // Find all PlayerGame records for this player
    const playerGames = await prisma.playerGame.findMany({
      where: { playerId },
      include: {
        game: {
          include: {
            playerGames: { include: { player: true } },
            images: { include: { player: true, votes: true } },
            promptChains: true,
          },
        },
      },
      orderBy: { game: { createdAt: 'desc' } },
    });

    // Filter by status and gameMode if provided
    let games = playerGames.map(pg => pg.game);
    if (status === 'complete') {
      games = games.filter((g: any) => g.phase === 'ENDED');
    } else if (status === 'in-progress') {
      games = games.filter((g: any) => g.phase !== 'ENDED');
    }
    if (gameMode) {
      games = games.filter((g: any) => g.gameMode === gameMode);
    }

    // Transform the data to include game summary information
    const gameHistory = games.map((game: any) => {
      const playerInGame = (game as any).playerGames.find((pg: any) => pg.playerId === playerId);
      const winner = (game as any).playerGames.reduce((prev: any, current: any) =>
        current.score > prev.score ? current : prev
      );
      const status = game.phase === 'ENDED' ? 'Complete' : 'In Progress';

      return {
        id: game.id,
        roomId: game.roomId,
        gameMode: game.gameMode,
        createdAt: game.createdAt,
        updatedAt: game.updatedAt,
        playerCount: (game as any).playerGames.length,
        playerScore: playerInGame?.score || 0,
        playerName: playerInGame?.player.name || 'Unknown',
        winner: {
          name: winner.player.name,
          score: winner.score
        },
        totalImages: (game as any).images.length,
        hasPromptChains: (game as any).promptChains.length > 0,
        status,
        phase: game.phase, // Include the actual phase for debugging
        // Include full data for detailed view
        fullGameData: {
          playerGames: (game as any).playerGames,
          images: (game as any).images,
          promptChains: (game as any).promptChains,
          currentRound: game.currentRound,
          maxRounds: game.maxRounds,
          currentWord: game.currentWord,
          exclusionWords: game.exclusionWords
        }
      };
    });

    res.json(gameHistory);
  } catch (error) {
    console.error('Error fetching game history:', error);
    res.status(500).json({ error: 'Failed to fetch game history' });
  }
});

// Add endpoint to auto-submit when timer expires
apiRouter.post('/games/:roomId/auto-submit', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { prompt, playerId } = req.body;

    if (!prompt || !playerId) {
      return res.status(400).json({ error: 'Prompt and playerId are required' });
    }

    const game = await prisma.game.findUnique({
      where: { roomId },
      include: {
        playerGames: { include: { player: true } },
        images: true,
        promptChains: true,
      },
    });

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Verify the player is in the game
    const player = game.playerGames.find(pg => pg.playerId === playerId);
    if (!player) {
      return res.status(403).json({ error: 'Player not in game' });
    }

    // Check if player has already submitted
    let alreadySubmitted = false;
    if (game.gameMode === 'PROMPTOPHONE') {
      const numPlayers = game.playerGames.length;
      const playerIndex = game.playerGames.findIndex(p => p.playerId === playerId);
      const chainIndex = (playerIndex + game.currentRound - 1) % numPlayers;
      const promptChain = game.promptChains[chainIndex];
      
      if (promptChain) {
        alreadySubmitted = (promptChain.chain as any[]).some((entry: any) => entry.playerId === playerId);
      }
    } else {
      alreadySubmitted = game.images.some(img => img.playerId === playerId);
    }

    if (alreadySubmitted) {
      return res.status(400).json({ error: 'Player has already submitted' });
    }

    // Submit the prompt using the existing logic
    if (game.gameMode === 'PROMPTOPHONE') {
      const numPlayers = game.playerGames.length;
      const playerIndex = game.playerGames.findIndex(p => p.playerId === playerId);
      const chainIndex = (playerIndex + game.currentRound - 1) % numPlayers;
      const promptChain = game.promptChains[chainIndex];
      
      if (!promptChain) {
        return res.status(400).json({ error: 'No prompt chain found for this round' });
      }

      // Create the image submission with a placeholder URL
      const image = await prisma.image.create({
        data: {
          prompt,
          playerId,
          gameId: game.id,
          url: `placeholder-${Date.now()}`,
        },
      });

      // Update the prompt chain for this round
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
          url: `placeholder-${Date.now()}`,
        },
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
        promptChains: true,
      },
    });

    if (!updatedGame) {
      throw new Error('Failed to fetch updated game state');
    }

    // Build response to match GET /games/:roomId
    const _game = updatedGame as any;
    let exclusionWords = _game.exclusionWords || [];
    if (_game.phase === 'PROMPT' && _game.currentWord) {
      const wordData = gameWords.find(w => w.word.toLowerCase() === _game.currentWord?.toLowerCase());
      if (wordData) {
        exclusionWords = wordData.exclusionWords;
      }
    }

    const response = {
      id: _game.id,
      roomId: _game.roomId,
      players: _game.playerGames.map((pg: any) => pg.player),
      currentRound: _game.currentRound,
      maxRounds: _game.maxRounds,
      currentWord: _game.currentWord,
      exclusionWords,
      rounds: [],
      isComplete: _game.phase === 'ENDED',
      phase: _game.phase,
      images: _game.images,
      gameMode: _game.gameMode,
      promptChains: _game.promptChains,
    };

    res.json(response);
  } catch (error) {
    console.error('Error auto-submitting prompt:', error);
    res.status(500).json({ error: 'Failed to auto-submit prompt' });
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

// Serve React app for all non-API routes (for production)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
  });
} 