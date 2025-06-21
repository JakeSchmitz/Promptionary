import express from 'express';
import cors from 'cors';
import path from 'path';

// Import routes
import gamesRouter from './routes/games';
import playersRouter from './routes/players';
import promptsRouter from './routes/prompts';
import imagesRouter from './routes/images';
import votesRouter from './routes/votes';
import roundsRouter from './routes/rounds';

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

// Serve static files from the React app build directory (for production)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../frontend/dist')));
}

// Log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Create a router for all /api routes
const apiRouter = express.Router();

// Mount resource routers
apiRouter.use('/games', gamesRouter);
apiRouter.use('/games', playersRouter); // Player endpoints are scoped under games
apiRouter.use('/games', promptsRouter); // Prompt endpoints are scoped under games
apiRouter.use('/games', imagesRouter);  // Image endpoints are scoped under games
apiRouter.use('/games', votesRouter);   // Vote endpoints are scoped under games
apiRouter.use('/games', roundsRouter);  // Round endpoints are scoped under games
apiRouter.use('/players', playersRouter); // Player-specific endpoints

// Mount the API router at /api
app.use('/api', apiRouter);

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