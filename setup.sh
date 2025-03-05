#!/bin/bash
# Fleet DMS Development Environment Setup Script
# This script sets up and starts both the backend and frontend services

# Print with colors
print_cyan() { echo -e "\e[36m$1\e[0m"; }
print_yellow() { echo -e "\e[33m$1\e[0m"; }
print_green() { echo -e "\e[32m$1\e[0m"; }
print_red() { echo -e "\e[31m$1\e[0m"; }

print_cyan "============================================="
print_cyan "Fleet DMS Development Environment Setup"
print_cyan "============================================="

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Function to check and setup backend
setup_backend() {
  print_yellow "\nSetting up backend..."
  
  # Navigate to backend directory
  cd "$(dirname "$0")/backend" || { print_red "Failed to enter backend directory"; return 1; }
  
  # Check if Python is installed
  if ! command_exists python3; then
    print_red "Python is not installed! Please install Python 3.8 or later."
    return 1
  fi
  
  # Check if virtual environment exists, create if not
  if [ ! -d "venv" ]; then
    print_green "Creating Python virtual environment..."
    python3 -m venv venv
  fi
  
  # Activate virtual environment
  print_green "Activating virtual environment..."
  # shellcheck source=/dev/null
  source venv/bin/activate
  
  # Install dependencies
  print_green "Installing backend dependencies..."
  pip install -r requirements.txt
  
  # Check if .env file exists, copy from example if not
  if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
      print_green "Creating .env file from .env.example..."
      cp .env.example .env
      print_yellow "Please edit the .env file with your own environment variables if needed."
    else
      print_red "No .env.example file found. Please create a .env file manually."
    fi
  fi
  
  return 0
}

# Function to check and setup frontend
setup_frontend() {
  print_yellow "\nSetting up frontend..."
  
  # Navigate to frontend directory
  cd "$(dirname "$0")/fleet-dms-frontend" || { print_red "Failed to enter frontend directory"; return 1; }
  
  # Check if Node.js is installed
  if ! command_exists node; then
    print_red "Node.js is not installed! Please install Node.js 16 or later."
    return 1
  fi
  
  # Check if npm is installed
  if ! command_exists npm; then
    print_red "npm is not installed! Please install npm."
    return 1
  fi
  
  # Install dependencies
  print_green "Installing frontend dependencies..."
  npm install
  
  return 0
}

# Function to start the backend server
start_backend_server() {
  print_yellow "\nStarting backend server..."
  
  # Navigate to backend directory
  cd "$(dirname "$0")/backend" || { print_red "Failed to enter backend directory"; return 1; }
  
  # Activate virtual environment
  source venv/bin/activate
  
  # Start the server in a new terminal window
  if command_exists gnome-terminal; then
    gnome-terminal -- bash -c "source venv/bin/activate && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000; exec bash"
  elif command_exists x-terminal-emulator; then
    x-terminal-emulator -e "bash -c 'source venv/bin/activate && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000; exec bash'"
  elif command_exists terminal; then
    terminal -e "bash -c 'source venv/bin/activate && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000; exec bash'"
  elif command_exists osascript; then
    # For macOS
    osascript -e "tell application \"Terminal\" to do script \"cd $(pwd) && source venv/bin/activate && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000\""
  else
    print_yellow "Could not determine terminal emulator. Starting server in background..."
    source venv/bin/activate && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
  fi
}

# Function to start the frontend development server
start_frontend_server() {
  print_yellow "\nStarting frontend development server..."
  
  # Navigate to frontend directory
  cd "$(dirname "$0")/fleet-dms-frontend" || { print_red "Failed to enter frontend directory"; return 1; }
  
  # Start the development server in a new terminal window
  if command_exists gnome-terminal; then
    gnome-terminal -- bash -c "npm run dev; exec bash"
  elif command_exists x-terminal-emulator; then
    x-terminal-emulator -e "bash -c 'npm run dev; exec bash'"
  elif command_exists terminal; then
    terminal -e "bash -c 'npm run dev; exec bash'"
  elif command_exists osascript; then
    # For macOS
    osascript -e "tell application \"Terminal\" to do script \"cd $(pwd) && npm run dev\""
  else
    print_yellow "Could not determine terminal emulator. Starting frontend server in background..."
    npm run dev &
  fi
}

# Main script execution
# Remember original location to restore it at the end
ORIGINAL_DIR=$(pwd)

# Setup backend
setup_backend
BACKEND_SUCCESS=$?

# Setup frontend
setup_frontend
FRONTEND_SUCCESS=$?

# Start services if setup was successful
if [ $BACKEND_SUCCESS -eq 0 ] && [ $FRONTEND_SUCCESS -eq 0 ]; then
  print_green "\nSetup completed successfully!"
  
  # Ask if user wants to start the servers
  read -r -p "Do you want to start the backend and frontend servers? (y/n) " START_SERVERS
  
  if [[ $START_SERVERS =~ ^[Yy]$ ]]; then
    start_backend_server
    start_frontend_server
    
    print_green "\nServers started successfully!"
    print_cyan "Backend running at: http://localhost:8000"
    print_cyan "Frontend running at: http://localhost:5173"
    print_cyan "API Documentation at: http://localhost:8000/docs"
  fi
else
  print_red "\nSetup failed. Please fix the issues above and try again."
fi

# Restore original location
cd "$ORIGINAL_DIR" || exit 1
