#!/bin/bash
# CWS Fleet Management System
# Startup Script with Virtual Environment

echo "===== CWS Fleet Management System ====="
echo "This script will install dependencies and start the application"

# Force close any existing instances
echo -e "\n\n===== Closing Existing Instances ====="
echo "Closing any existing Node.js/Vite processes..."
pkill -f "vite" || true
echo "Closing any existing Python/uvicorn processes..."
pkill -f "uvicorn" || true
pkill -f "main.py" || true

# Set working directory to the project root
cd "$(dirname "$0")"

# Create and activate virtual environment
echo -e "\n\n===== Creating Python Virtual Environment ====="
python -m venv venv
source venv/bin/activate
pip install --upgrade pip

# Install backend dependencies
echo -e "\n\n===== Installing Backend Dependencies ====="
cd backend
pip install fastapi uvicorn sqlalchemy psycopg2-binary pydantic python-jose[cryptography] passlib[bcrypt] python-multipart

# Run the test data script to populate the database
echo -e "\n\n===== Populating Database with Test Data ====="
python test-data-script.py

# Start the backend server in the background
echo -e "\n\n===== Starting Backend Server ====="
python main.py &
BACKEND_PID=$!
echo "Backend server started with PID: $BACKEND_PID"

# Install frontend dependencies
echo -e "\n\n===== Installing Frontend Dependencies ====="
cd ../fleet-dms-frontend
npm install
npm install -D tailwindcss autoprefixer postcss

# Start the frontend server
echo -e "\n\n===== Starting Frontend Server ====="
npm run dev

# Cleanup function to kill the backend server when the script exits
cleanup() {
  echo -e "\n\n===== Shutting Down Servers ====="
  kill $BACKEND_PID
  echo "Backend server stopped"
  deactivate
  echo "Virtual environment deactivated"
}

# Register the cleanup function to be called on script exit
trap cleanup EXIT

# Wait for the frontend server to exit
wait
