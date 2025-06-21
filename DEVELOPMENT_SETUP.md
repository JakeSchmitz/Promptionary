# Promptionary Development Setup

This guide covers all the different ways to set up and run the Promptionary application locally for development.

## Prerequisites

- **Node.js** (>= 18.0.0)
- **npm** (>= 11.4.2)
- **PostgreSQL** (>= 14) - for local database
- **Docker** (optional) - for containerized development
- **VS Code** (optional) - for enhanced development experience

## Quick Start

### Option 1: Automated Setup Script (Recommended)

The easiest way to get started is using the automated setup script:

```bash
# Make the script executable (first time only)
chmod +x dev-setup.sh

# Setup environment and start all services
./dev-setup.sh start
```

This will:
- Create environment files from examples
- Install all dependencies
- Set up the database
- Start both backend and frontend servers

### Option 2: Manual Setup

If you prefer to set up everything manually:

#### 1. Environment Setup

**Backend Environment:**
```bash
cd apps/backend
cp env.example .env
# Edit .env with your actual configuration
```

**Frontend Environment:**
```bash
cd apps/frontend
cp env.example .env
# Edit .env with your actual configuration
```

#### 2. Install Dependencies

```bash
# Install backend dependencies
cd apps/backend
npm install

# Install frontend dependencies
cd apps/frontend
npm install
```

#### 3. Database Setup

Make sure PostgreSQL is running and create a database:

```bash
# Create database (if using local PostgreSQL)
createdb promptionary_db

# Run migrations
cd apps/backend
npx prisma generate
npx prisma migrate deploy
```

#### 4. Start Services

**Terminal 1 - Backend:**
```bash
cd apps/backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd apps/frontend
npm run dev
```

### Option 3: Docker Compose

For a fully containerized development environment:

```bash
# Start all services
docker-compose -f docker-compose.dev.yml up

# Start in background
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop services
docker-compose -f docker-compose.dev.yml down
```

## VS Code Development

If you're using VS Code, we've provided launch configurations and tasks for enhanced development experience.

### Launch Configurations

Access via `Run and Debug` panel (Ctrl+Shift+D):

- **Debug Backend** - Debug the backend server
- **Debug Frontend** - Debug the frontend with Chrome DevTools
- **Debug Full Stack** - Debug both backend and frontend simultaneously
- **Debug Backend Tests** - Debug backend tests
- **Debug Frontend Tests** - Debug frontend tests

### Tasks

Access via `Terminal > Run Task` (Ctrl+Shift+P):

- **start-backend-dev** - Start backend development server
- **start-frontend-dev** - Start frontend development server
- **start-full-stack** - Start both servers
- **run-all-tests** - Run all tests
- **install-all-deps** - Install all dependencies
- **build-all** - Build both applications
- **lint-all** - Lint all code
- **setup-dev-environment** - Run the setup script

## Development Scripts

### Main Development Script

The `dev-setup.sh` script provides several commands:

```bash
# Setup environment files and install dependencies
./dev-setup.sh setup

# Start all services (default)
./dev-setup.sh start

# Stop all services
./dev-setup.sh stop

# Check service status
./dev-setup.sh status

# View logs
./dev-setup.sh logs backend
./dev-setup.sh logs frontend

# Restart all services
./dev-setup.sh restart
```

### Individual App Scripts

**Backend:**
```bash
cd apps/backend
npm run dev          # Start development server
npm run build        # Build for production
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage
```

**Frontend:**
```bash
cd apps/frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm test             # Run tests
npm run lint         # Lint and fix code
npm run lint:check   # Check linting without fixing
```

## Environment Variables

### Backend (.env)

```env
# Database Configuration
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/promptionary_db"

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Server Configuration
PORT=3000
NODE_ENV=development

# CORS Configuration
CORS_ORIGINS=http://localhost:5173,http://localhost:8080

# Optional: Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

### Frontend (.env)

```env
# API Configuration
VITE_API_URL=http://localhost:3000/api

# Google OAuth Configuration
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here

# Development Configuration
VITE_DEV_MODE=true
VITE_DEBUG_ENABLED=true
```

## Database Management

### Local PostgreSQL

```bash
# Start PostgreSQL service
brew services start postgresql  # macOS
sudo systemctl start postgresql # Linux

# Create database
createdb promptionary_db

# Run migrations
cd apps/backend
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset
```

### Docker PostgreSQL

```bash
# Start PostgreSQL container
docker run -d \
  --name promptionary-postgres \
  -e POSTGRES_DB=promptionary_db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  postgres:15-alpine
```

## Troubleshooting

### Common Issues

**Port already in use:**
```bash
# Kill processes on specific ports
lsof -ti :3000 | xargs kill -9
lsof -ti :5173 | xargs kill -9
```

**Database connection issues:**
- Ensure PostgreSQL is running
- Check DATABASE_URL in backend/.env
- Verify database exists: `psql -l | grep promptionary_db`

**Frontend can't connect to backend:**
- Ensure backend is running on port 3000
- Check VITE_API_URL in frontend/.env
- Verify CORS settings in backend

**Permission denied errors:**
```bash
# Make scripts executable
chmod +x dev-setup.sh
chmod +x start.sh
chmod +x kill-local.sh
```

### Logs

**View backend logs:**
```bash
tail -f tmp/backend.log
```

**View frontend logs:**
```bash
tail -f tmp/frontend.log
```

**View Docker logs:**
```bash
docker-compose -f docker-compose.dev.yml logs -f
```

## Development Workflow

### Typical Development Session

1. **Start the environment:**
   ```bash
   ./dev-setup.sh start
   ```

2. **Make changes to code**

3. **Run tests:**
   ```bash
   # Backend tests
   cd apps/backend && npm test
   
   # Frontend tests
   cd apps/frontend && npm test
   ```

4. **Check linting:**
   ```bash
   # Backend
   cd apps/backend && npm run lint
   
   # Frontend
   cd apps/frontend && npm run lint
   ```

5. **Stop the environment:**
   ```bash
   ./dev-setup.sh stop
   ```

### Hot Reloading

Both frontend and backend support hot reloading:
- **Frontend**: Vite automatically reloads on file changes
- **Backend**: ts-node-dev automatically restarts on file changes

### Database Changes

When making database schema changes:

```bash
cd apps/backend

# Create a new migration
npx prisma migrate dev --name description_of_changes

# Apply migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

## Production Build

To test the production build locally:

```bash
# Build both applications
cd apps/backend && npm run build
cd apps/frontend && npm run build

# Start production server
cd apps/backend && npm start
```

The backend will serve the frontend static files in production mode.

## Additional Resources

- [Backend API Documentation](./apps/backend/README.md)
- [Frontend Documentation](./apps/frontend/README.md)
- [Infrastructure Setup](./infra/README.md)
- [Testing Guide](./LOCAL_TESTING_SUMMARY.md) 