# Promptionary

A multiplayer game where players craft creative AI prompts, vote on the best submissions, and discover how AI interprets their ideas.

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

## CI/CD and Deployment

### Continuous Integration

The project uses GitHub Actions for CI/CD with the following workflows:

1. **PR Checks**: Automatically runs on pull requests to main
   - Frontend: Linting, tests, and build verification
   - Backend: Type checking and build verification
   - All checks must pass before merging

2. **Production Deployment**: Automatically deploys to GKE on push to main
   - Builds and pushes Docker images
   - Deploys to production Kubernetes cluster
   - Runs database migrations

3. **Test Environment Deployment**: Manual deployment of any branch
   - Trigger via GitHub Actions UI
   - Select any branch to deploy
   - Separate test environment with its own database

### Infrastructure

The infrastructure is managed with Terraform and includes:
- Google Kubernetes Engine (GKE) clusters
- Cloud SQL PostgreSQL databases
- VPC networking
- Load balancers for external access

See [infra/README.md](infra/README.md) for detailed infrastructure documentation.

### Setting up Branch Protection

To enable required PR checks:
1. Go to Settings → Branches in your GitHub repository
2. Add a rule for the `main` branch
3. Enable "Require status checks to pass before merging"
4. Select the required checks:
   - Frontend Tests and Linting
   - Backend Type Checking and Build

### Deployment Commands

Deploy to production (automatic on push to main):
```bash
git push origin main
```

Deploy to test environment (manual via GitHub Actions):
1. Go to Actions → Deploy to Test Environment
2. Enter the branch name
3. Run the workflow

For detailed workflow documentation, see [.github/workflows/README.md](.github/workflows/README.md).

### Domain Configuration

The application is configured to be accessible at:
- **Production**: https://promptionary.ai and https://www.promptionary.ai
- **Test**: https://test.promptionary.ai

Domain setup includes:
- Automatic SSL certificate provisioning
- DNS management through Google Cloud DNS
- Forced HTTPS for all traffic

For detailed domain setup instructions, see [infra/DOMAIN_SETUP.md](infra/DOMAIN_SETUP.md).
