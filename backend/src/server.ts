import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import prisma from './db';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Create a new game
app.post('/api/games', async (req, res) => {
  try {
    const { name } = req.body;
    const game = await prisma.game.create({
      data: {
        name,
        status: 'waiting',
      },
    });
    res.json(game);
  } catch (error) {
    console.error('Error creating game:', error);
    res.status(500).json({ error: 'Failed to create game' });
  }
});

// Add participant to game
app.post('/api/games/:gameId/participants', async (req, res) => {
  try {
    const { gameId } = req.params;
    const { name } = req.body;
    const participant = await prisma.participant.create({
      data: {
        name,
        gameId,
      },
    });
    res.json(participant);
  } catch (error) {
    console.error('Error adding participant:', error);
    res.status(500).json({ error: 'Failed to add participant' });
  }
});

// Generate image
app.post('/api/games/:gameId/images', async (req, res) => {
  try {
    const { gameId } = req.params;
    const { prompt } = req.body;

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
    
    // Save the generated image to the database
    const image = await prisma.generatedImage.create({
      data: {
        prompt,
        imageUrl,
        gameId,
      },
    });

    res.json(image);
  } catch (error) {
    console.error('Error generating image:', error);
    res.status(500).json({ error: 'Failed to generate image' });
  }
});

// Get game details
app.get('/api/games/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        participants: true,
        images: true,
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

// Update game status
app.patch('/api/games/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    const { status } = req.body;
    
    const game = await prisma.game.update({
      where: { id: gameId },
      data: { status },
    });
    
    res.json(game);
  } catch (error) {
    console.error('Error updating game:', error);
    res.status(500).json({ error: 'Failed to update game' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
}); 