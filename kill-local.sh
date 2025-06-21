#!/bin/bash

echo "Killing local development processes..."

# Kill the processes from start.sh
if [ -f "tmp/backend.pid" ]; then
    BACKEND_PID=$(cat tmp/backend.pid)
    echo "Killing backend process $BACKEND_PID..."
    kill $BACKEND_PID 2>/dev/null || true
    rm tmp/backend.pid
fi

if [ -f "tmp/frontend.pid" ]; then
    FRONTEND_PID=$(cat tmp/frontend.pid)
    echo "Killing frontend process $FRONTEND_PID..."
    kill $FRONTEND_PID 2>/dev/null || true
    rm tmp/frontend.pid
fi

# Also kill any processes using the ports
echo "Killing any processes on ports 3000 and 5173..."
lsof -ti :3000 | xargs kill -9 2>/dev/null || true
lsof -ti :5173 | xargs kill -9 2>/dev/null || true

# Kill any node or vite processes
echo "Killing any remaining node or vite processes..."
pkill -f "node.*server.js" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true

echo "✅ All local development processes killed!"
echo "You can now run ./docker-local.sh" 