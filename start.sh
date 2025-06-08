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

# Start backend server
echo "Starting backend server..."
cd backend
npx prisma generate
npm run dev > "$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!

# Start frontend server
echo "Starting frontend server..."
cd ..
npm run dev > "$FRONTEND_LOG" 2>&1 &
FRONTEND_PID=$!

# Function to handle script termination
cleanup() {
    echo "Shutting down servers..."
    kill $BACKEND_PID
    kill $FRONTEND_PID
    rm -rf tmp
    exit 0
}

# Set up trap to catch termination signal
trap cleanup SIGINT SIGTERM

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID

# Keep script running and display backend logs
echo "Servers are running. Press Ctrl+C to stop."
echo "Backend logs:"
tail -f "$BACKEND_LOG" 