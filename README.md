# Promptionary

A game for friends and fun

## About

Promptionary is a multiplayer game where players take turns creating prompts for AI-generated images. Players can join game rooms, create prompts, and vote on the best generated images.

## Features

- Real-time multiplayer gameplay
- AI-powered image generation using DALL-E 3
- Game rooms with participant management
- Persistent storage using PostgreSQL
- Modern React frontend with TypeScript
- Express.js backend

## Prerequisites

- **Node.js** (v18 or higher recommended)
- **npm** (comes with Node.js)
- **PostgreSQL** (for the database)

## Environment Variables

### Backend (`apps/backend/.env`)
- `OPENAI_API_KEY` – Your OpenAI API key (required for image generation)
- `DATABASE_URL` – PostgreSQL connection string (e.g. `postgresql://postgres:postgres@localhost:5432/promptionary`)

### Frontend (`apps/frontend/.env`)
- `VITE_API_URL` – URL for backend API (default: `http://localhost:3000/api`)
- `VITE_GOOGLE_CLIENT_ID` – Google OAuth Client ID (if using Google login)

## Setup

1. **Clone the repository**
2. **Install dependencies:**
   ```bash
   # Install frontend dependencies
   cd apps/frontend
   npm install

   # Install backend dependencies
   cd ../backend
   npm install
   ```
3. **Set up environment variables:**
   - Create `.env` in `apps/backend/` with:
     ```
     DATABASE_URL="postgresql://postgres:postgres@localhost:5432/promptionary"
     OPENAI_API_KEY="your-openai-api-key"
     ```
   - (Optional) Create `.env` in `apps/frontend/` with:
     ```
     VITE_API_URL="http://localhost:3000/api"
     VITE_GOOGLE_CLIENT_ID="your-google-client-id"
     ```

## Building the Application

### Build the Frontend
```bash
cd apps/frontend
npm run build
```

### Build the Backend
```bash
cd apps/backend
npm run build
```

## Running the Application

From the project root, run:
```bash
./start.sh
```
This will start both the backend (on port 3000) and frontend (on port 5173) servers. Logs are available in the `tmp/` directory.

## Tech Stack

- Frontend: React, TypeScript, Vite
- Backend: Express.js, TypeScript
- Database: PostgreSQL with Prisma ORM
- AI: OpenAI DALL-E 3
