#!/bin/bash

# Kill any existing Node.js processes on ports 3000 and 5173/5174
echo "Cleaning up old processes..."
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null
lsof -ti:5174 | xargs kill -9 2>/dev/null

# Create a temporary directory for logs
echo "Setting up log directory..."
rm -rf tmp
mkdir -p tmp

# Get absolute paths for logs
ROOT_DIR="$(pwd)"
BACKEND_LOG="$ROOT_DIR/tmp/backend.log"
FRONTEND_LOG="$ROOT_DIR/tmp/frontend.log"

# Start backend server and redirect output to a file
echo "Starting backend server..."
cd backend && npm run dev > "$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!
cd "$ROOT_DIR"

# Wait a moment for backend to start
sleep 2

# Start frontend server and redirect output to a file
echo "Starting frontend server..."
npm run dev > "$FRONTEND_LOG" 2>&1 &
FRONTEND_PID=$!

# Function to handle script termination
cleanup() {
    echo "Shutting down servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    rm -rf tmp
    exit 0
}

# Set up trap to catch termination signal
trap cleanup SIGINT SIGTERM

# Keep script running and display backend logs
echo "Servers are running. Press Ctrl+C to stop."
echo "Backend logs:"
tail -f "$BACKEND_LOG" 