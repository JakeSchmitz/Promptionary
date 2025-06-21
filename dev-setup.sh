#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

print_header() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

# Get the project root directory
PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$PROJECT_ROOT/apps/backend"
FRONTEND_DIR="$PROJECT_ROOT/apps/frontend"

print_header "Promptionary Development Setup"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js (>=18) and try again."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm and try again."
    exit 1
fi

print_status "Node.js version: $(node --version)"
print_status "npm version: $(npm --version)"

# Function to setup environment files
setup_env_files() {
    print_header "Setting up environment files"
    
    # Backend environment setup
    if [ ! -f "$BACKEND_DIR/.env" ]; then
        if [ -f "$BACKEND_DIR/env.example" ]; then
            print_status "Creating backend .env file from example..."
            cp "$BACKEND_DIR/env.example" "$BACKEND_DIR/.env"
            print_warning "Please edit $BACKEND_DIR/.env with your actual configuration"
        else
            print_warning "No env.example found for backend. Creating basic .env file..."
            cat > "$BACKEND_DIR/.env" << EOF
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/promptionary_db"
OPENAI_API_KEY=your_openai_api_key_here
PORT=3000
NODE_ENV=development
EOF
        fi
    else
        print_status "Backend .env file already exists"
    fi
    
    # Frontend environment setup
    if [ ! -f "$FRONTEND_DIR/.env" ]; then
        if [ -f "$FRONTEND_DIR/env.example" ]; then
            print_status "Creating frontend .env file from example..."
            cp "$FRONTEND_DIR/env.example" "$FRONTEND_DIR/.env"
            print_warning "Please edit $FRONTEND_DIR/.env with your actual configuration"
        else
            print_warning "No env.example found for frontend. Creating basic .env file..."
            cat > "$FRONTEND_DIR/.env" << EOF
VITE_API_URL=http://localhost:3000/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
EOF
        fi
    else
        print_status "Frontend .env file already exists"
    fi
}

# Function to install dependencies
install_dependencies() {
    print_header "Installing dependencies"
    
    # Install backend dependencies
    print_status "Installing backend dependencies..."
    cd "$BACKEND_DIR"
    npm install
    
    # Install frontend dependencies
    print_status "Installing frontend dependencies..."
    cd "$FRONTEND_DIR"
    npm install
    
    cd "$PROJECT_ROOT"
}

# Function to setup database
setup_database() {
    print_header "Setting up database"
    
    # Check if PostgreSQL is running locally
    if command -v pg_isready &> /dev/null; then
        if pg_isready -h localhost -p 5432 &> /dev/null; then
            print_status "PostgreSQL is running locally"
        else
            print_warning "PostgreSQL is not running locally. You may need to:"
            echo "  1. Install PostgreSQL"
            echo "  2. Start PostgreSQL service"
            echo "  3. Create a database named 'promptionary_db'"
            echo "  4. Update DATABASE_URL in backend/.env"
        fi
    else
        print_warning "PostgreSQL client not found. You may need to install PostgreSQL."
    fi
    
    # Run database migrations if backend is set up
    if [ -f "$BACKEND_DIR/.env" ]; then
        print_status "Running database migrations..."
        cd "$BACKEND_DIR"
        npx prisma generate
        npx prisma migrate deploy
        cd "$PROJECT_ROOT"
    fi
}

# Function to start services
start_services() {
    print_header "Starting services"
    
    # Create log directory
    LOG_DIR="$PROJECT_ROOT/tmp"
    mkdir -p "$LOG_DIR"
    
    # Kill any existing processes
    print_status "Cleaning up existing processes..."
    pkill -f "ts-node-dev.*server.ts" || true
    pkill -f "vite" || true
    lsof -ti :3000 | xargs kill -9 2>/dev/null || true
    lsof -ti :5173 | xargs kill -9 2>/dev/null || true
    
    # Start backend
    print_status "Starting backend server..."
    cd "$BACKEND_DIR"
    npm run dev > "$LOG_DIR/backend.log" 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > "$LOG_DIR/backend.pid"
    
    # Wait for backend to start
    sleep 3
    
    # Start frontend
    print_status "Starting frontend server..."
    cd "$FRONTEND_DIR"
    npm run dev > "$LOG_DIR/frontend.log" 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > "$LOG_DIR/frontend.pid"
    
    cd "$PROJECT_ROOT"
    
    print_status "Services started!"
    echo ""
    print_header "Access URLs"
    echo "Backend API: http://localhost:3000"
    echo "Frontend App: http://localhost:5173"
    echo "Health Check: http://localhost:3000/health"
    echo ""
    print_header "Logs"
    echo "Backend logs: tail -f $LOG_DIR/backend.log"
    echo "Frontend logs: tail -f $LOG_DIR/frontend.log"
    echo ""
    print_warning "Press Ctrl+C to stop all services"
    
    # Wait for user to stop
    wait
}

# Function to stop services
stop_services() {
    print_header "Stopping services"
    
    LOG_DIR="$PROJECT_ROOT/tmp"
    
    if [ -f "$LOG_DIR/backend.pid" ]; then
        BACKEND_PID=$(cat "$LOG_DIR/backend.pid")
        kill $BACKEND_PID 2>/dev/null || true
        rm "$LOG_DIR/backend.pid"
        print_status "Backend stopped"
    fi
    
    if [ -f "$LOG_DIR/frontend.pid" ]; then
        FRONTEND_PID=$(cat "$LOG_DIR/frontend.pid")
        kill $FRONTEND_PID 2>/dev/null || true
        rm "$LOG_DIR/frontend.pid"
        print_status "Frontend stopped"
    fi
    
    # Kill any remaining processes
    pkill -f "ts-node-dev.*server.ts" || true
    pkill -f "vite" || true
}

# Function to show status
show_status() {
    print_header "Service Status"
    
    LOG_DIR="$PROJECT_ROOT/tmp"
    
    if [ -f "$LOG_DIR/backend.pid" ]; then
        BACKEND_PID=$(cat "$LOG_DIR/backend.pid")
        if kill -0 $BACKEND_PID 2>/dev/null; then
            print_status "✅ Backend is running (PID: $BACKEND_PID)"
        else
            print_error "❌ Backend is not running"
        fi
    else
        print_error "❌ Backend is not running"
    fi
    
    if [ -f "$LOG_DIR/frontend.pid" ]; then
        FRONTEND_PID=$(cat "$LOG_DIR/frontend.pid")
        if kill -0 $FRONTEND_PID 2>/dev/null; then
            print_status "✅ Frontend is running (PID: $FRONTEND_PID)"
        else
            print_error "❌ Frontend is not running"
        fi
    else
        print_error "❌ Frontend is not running"
    fi
}

# Function to show logs
show_logs() {
    LOG_DIR="$PROJECT_ROOT/tmp"
    
    if [ "$1" = "backend" ]; then
        if [ -f "$LOG_DIR/backend.log" ]; then
            tail -f "$LOG_DIR/backend.log"
        else
            print_error "Backend log file not found"
        fi
    elif [ "$1" = "frontend" ]; then
        if [ -f "$LOG_DIR/frontend.log" ]; then
            tail -f "$LOG_DIR/frontend.log"
        else
            print_error "Frontend log file not found"
        fi
    else
        print_error "Usage: $0 logs [backend|frontend]"
    fi
}

# Main script logic
case "${1:-start}" in
    "setup")
        setup_env_files
        install_dependencies
        setup_database
        ;;
    "start")
        setup_env_files
        install_dependencies
        setup_database
        start_services
        ;;
    "stop")
        stop_services
        ;;
    "status")
        show_status
        ;;
    "logs")
        show_logs "$2"
        ;;
    "restart")
        stop_services
        sleep 2
        start_services
        ;;
    *)
        echo "Usage: $0 {setup|start|stop|status|logs|restart}"
        echo ""
        echo "Commands:"
        echo "  setup    - Setup environment files and install dependencies"
        echo "  start    - Setup and start all services (default)"
        echo "  stop     - Stop all services"
        echo "  status   - Show service status"
        echo "  logs     - Show logs (use: $0 logs [backend|frontend])"
        echo "  restart  - Restart all services"
        exit 1
        ;;
esac 