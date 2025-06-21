#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
FRONTEND_PORT=8080
BACKEND_PORT=3000
FRONTEND_IMAGE="promptionary-frontend:local"
BACKEND_IMAGE="promptionary-backend:local"
FRONTEND_CONTAINER="promptionary-frontend-local"
BACKEND_CONTAINER="promptionary-backend-local"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to cleanup containers (only when explicitly called)
cleanup() {
    print_status "Stopping and removing containers..."
    docker stop $FRONTEND_CONTAINER $BACKEND_CONTAINER 2>/dev/null || true
    docker rm $FRONTEND_CONTAINER $BACKEND_CONTAINER 2>/dev/null || true
    print_status "Containers stopped and removed"
}

# Function to cleanup images
cleanup_images() {
    print_status "Removing images..."
    docker rmi $FRONTEND_IMAGE $BACKEND_IMAGE 2>/dev/null || true
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check command line arguments
if [ "$1" = "stop" ]; then
    cleanup
    exit 0
fi

if [ "$1" = "status" ]; then
    echo "Container Status:"
    echo "================="
    if docker ps | grep -q $BACKEND_CONTAINER; then
        print_status "✅ Backend container is running"
    else
        print_error "❌ Backend container is not running"
    fi
    
    if docker ps | grep -q $FRONTEND_CONTAINER; then
        print_status "✅ Frontend container is running"
    else
        print_error "❌ Frontend container is not running"
    fi
    exit 0
fi

if [ "$1" = "logs" ]; then
    print_status "Showing container logs (Ctrl+C to stop)..."
    docker logs -f $BACKEND_CONTAINER $FRONTEND_CONTAINER
    exit 0
fi

print_status "Starting Promptionary local development environment..."

# Get the project root directory
PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"

# Check for .env files
BACKEND_ENV_FILE="$PROJECT_ROOT/apps/backend/.env"
FRONTEND_ENV_FILE="$PROJECT_ROOT/apps/frontend/.env"

if [ ! -f "$BACKEND_ENV_FILE" ]; then
    print_warning "Backend .env file not found at $BACKEND_ENV_FILE"
    print_warning "Using default environment variables"
    BACKEND_ENV_FILE=""
fi

if [ ! -f "$FRONTEND_ENV_FILE" ]; then
    print_warning "Frontend .env file not found at $FRONTEND_ENV_FILE"
    print_warning "Using default environment variables"
    FRONTEND_ENV_FILE=""
fi

# Check if containers are already running
if docker ps | grep -q $BACKEND_CONTAINER; then
    print_warning "Backend container is already running. Stopping it first..."
    docker stop $BACKEND_CONTAINER
    docker rm $BACKEND_CONTAINER
fi

if docker ps | grep -q $FRONTEND_CONTAINER; then
    print_warning "Frontend container is already running. Stopping it first..."
    docker stop $FRONTEND_CONTAINER
    docker rm $FRONTEND_CONTAINER
fi

# Build frontend
print_status "Building frontend Docker image..."
cd "$PROJECT_ROOT"
docker build -t $FRONTEND_IMAGE -f apps/frontend/Dockerfile .

if [ $? -eq 0 ]; then
    print_status "✅ Frontend build successful"
else
    print_error "❌ Frontend build failed"
    exit 1
fi

# Build backend
print_status "Building backend Docker image..."
cd "$PROJECT_ROOT/apps/backend"
docker build -t $BACKEND_IMAGE .

if [ $? -eq 0 ]; then
    print_status "✅ Backend build successful"
else
    print_error "❌ Backend build failed"
    exit 1
fi

# Start backend container with .env file if available
print_status "Starting backend container..."
if [ -n "$BACKEND_ENV_FILE" ]; then
    print_status "Using backend .env file: $BACKEND_ENV_FILE"
    docker run -d \
        --name $BACKEND_CONTAINER \
        -p $BACKEND_PORT:3000 \
        --env-file "$BACKEND_ENV_FILE" \
        $BACKEND_IMAGE
else
    print_warning "Using default backend environment variables"
    docker run -d \
        --name $BACKEND_CONTAINER \
        -p $BACKEND_PORT:3000 \
        -e DATABASE_URL="postgresql://postgres:password@localhost:5432/promptionary" \
        -e OPENAI_API_KEY="test-key" \
        $BACKEND_IMAGE
fi

if [ $? -eq 0 ]; then
    print_status "✅ Backend container started"
else
    print_error "❌ Backend container failed to start"
    exit 1
fi

# Wait a moment for backend to start
sleep 3

# Start frontend container with .env file if available
print_status "Starting frontend container..."
if [ -n "$FRONTEND_ENV_FILE" ]; then
    print_status "Using frontend .env file: $FRONTEND_ENV_FILE"
    docker run -d \
        --name $FRONTEND_CONTAINER \
        -p $FRONTEND_PORT:80 \
        --env-file "$FRONTEND_ENV_FILE" \
        $FRONTEND_IMAGE
else
    print_warning "Using default frontend environment variables"
    docker run -d \
        --name $FRONTEND_CONTAINER \
        -p $FRONTEND_PORT:80 \
        $FRONTEND_IMAGE
fi

if [ $? -eq 0 ]; then
    print_status "✅ Frontend container started"
else
    print_error "❌ Frontend container failed to start"
    exit 1
fi

# Wait for containers to be ready
print_status "Waiting for containers to be ready..."
sleep 5

# Check if containers are running
if docker ps | grep -q $BACKEND_CONTAINER; then
    print_status "✅ Backend is running on http://localhost:$BACKEND_PORT"
else
    print_error "❌ Backend container is not running"
    docker logs $BACKEND_CONTAINER
    exit 1
fi

if docker ps | grep -q $FRONTEND_CONTAINER; then
    print_status "✅ Frontend is running on http://localhost:$FRONTEND_PORT"
else
    print_error "❌ Frontend container is not running"
    docker logs $FRONTEND_CONTAINER
    exit 1
fi

print_status "🎉 Promptionary is now running locally!"
echo ""
echo "Frontend: http://localhost:$FRONTEND_PORT"
echo "Backend:  http://localhost:$BACKEND_PORT"
echo ""
echo "Commands:"
echo "  ./docker-local.sh status  - Check container status"
echo "  ./docker-local.sh logs    - View container logs"
echo "  ./docker-local.sh stop    - Stop and remove containers"
echo ""
print_status "Containers will keep running until you stop them manually." 