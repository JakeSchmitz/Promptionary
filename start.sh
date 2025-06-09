#!/bin/bash

# Get the absolute path to the project root
PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="$PROJECT_ROOT/tmp"
BACKEND_LOG="$LOG_DIR/backend.log"
FRONTEND_LOG="$LOG_DIR/frontend.log"
BACKEND_PID_FILE="$LOG_DIR/backend.pid"
FRONTEND_PID_FILE="$LOG_DIR/frontend.pid"

# Clean up old processes
echo "Cleaning up old processes..."
pkill -f "node.*server.js" || true
pkill -f "vite" || true

# Create log directory if it doesn't exist
mkdir -p "$LOG_DIR"

# Kill any process running on port 3000
echo "Killing any process running on port 3000..."
lsof -ti :3000 | xargs kill -9 2>/dev/null || true

# Start backend server
echo "Starting backend server..."
cd "$PROJECT_ROOT/apps/backend"
PORT=3000 npm run dev > "$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!

# Wait for backend to start
sleep 2

# Start frontend server
echo "Starting frontend server..."
cd "$PROJECT_ROOT/apps/frontend"
npm run dev > "$FRONTEND_LOG" 2>&1 &
FRONTEND_PID=$!

# Save PIDs to file
echo $BACKEND_PID > "$BACKEND_PID_FILE"
echo $FRONTEND_PID > "$FRONTEND_PID_FILE"

echo "Servers started!"
echo "Backend running at http://localhost:3000"
echo "Frontend running at http://localhost:5173"
echo "Check $BACKEND_LOG and $FRONTEND_LOG for logs" 