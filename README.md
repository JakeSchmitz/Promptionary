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

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   # Install frontend dependencies
   npm install
   
   # Install backend dependencies
   cd backend
   npm install
   ```
3. Set up environment variables:
   - Create `.env` in the backend directory with:
     ```
     DATABASE_URL="postgresql://postgres:postgres@localhost:5432/promptionary"
     OPENAI_API_KEY="your-openai-api-key"
     ```
4. Start the development servers:
   ```bash
   ./start.sh
   ```

## Tech Stack

- Frontend: React, TypeScript, Vite
- Backend: Express.js, TypeScript
- Database: PostgreSQL with Prisma ORM
- AI: OpenAI DALL-E 3
