# Fleet DMS Development Environment Setup Script
# This script sets up and starts both the backend and frontend services

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "Fleet DMS Development Environment Setup" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# Function to check if a command exists
function Test-CommandExists {
    param ($command)
    $exists = $null -ne (Get-Command $command -ErrorAction SilentlyContinue)
    return $exists
}

# Function to check and setup backend
function Setup-Backend {
    Write-Host "`nSetting up backend..." -ForegroundColor Yellow
    
    # Navigate to backend directory
    Set-Location -Path "$PSScriptRoot\backend"
    
    # Check if Python is installed
    if (-not (Test-CommandExists "python")) {
        Write-Host "Python is not installed! Please install Python 3.8 or later." -ForegroundColor Red
        return $false
    }
    
    # Check if virtual environment exists, create if not
    if (-not (Test-Path -Path "venv")) {
        Write-Host "Creating Python virtual environment..." -ForegroundColor Green
        python -m venv venv
    }
    
    # Activate virtual environment
    Write-Host "Activating virtual environment..." -ForegroundColor Green
    & "./venv/Scripts/Activate.ps1"
    
    # Install dependencies
    Write-Host "Installing backend dependencies..." -ForegroundColor Green
    pip install -r requirements.txt
    
    # Check if .env file exists, copy from example if not
    if (-not (Test-Path -Path ".env")) {
        if (Test-Path -Path ".env.example") {
            Write-Host "Creating .env file from .env.example..." -ForegroundColor Green
            Copy-Item -Path ".env.example" -Destination ".env"
            Write-Host "Please edit the .env file with your own environment variables if needed." -ForegroundColor Yellow
        } else {
            Write-Host "No .env.example file found. Please create a .env file manually." -ForegroundColor Red
        }
    }
    
    return $true
}

# Function to check and setup frontend
function Setup-Frontend {
    Write-Host "`nSetting up frontend..." -ForegroundColor Yellow
    
    # Navigate to frontend directory
    Set-Location -Path "$PSScriptRoot\fleet-dms-frontend"
    
    # Check if Node.js is installed
    if (-not (Test-CommandExists "node")) {
        Write-Host "Node.js is not installed! Please install Node.js 16 or later." -ForegroundColor Red
        return $false
    }
    
    # Check if npm is installed
    if (-not (Test-CommandExists "npm")) {
        Write-Host "npm is not installed! Please install npm." -ForegroundColor Red
        return $false
    }
    
    # Install dependencies
    Write-Host "Installing frontend dependencies..." -ForegroundColor Green
    npm install
    
    return $true
}

# Function to start the backend server
function Start-BackendServer {
    Write-Host "`nStarting backend server..." -ForegroundColor Yellow
    
    # Navigate to backend directory
    Set-Location -Path "$PSScriptRoot\backend"
    
    # Activate virtual environment
    & "./venv/Scripts/Activate.ps1"
    
    # Start the server
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"
}

# Function to start the frontend development server
function Start-FrontendServer {
    Write-Host "`nStarting frontend development server..." -ForegroundColor Yellow
    
    # Navigate to frontend directory
    Set-Location -Path "$PSScriptRoot\fleet-dms-frontend"
    
    # Start the development server
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"
}

# Main script execution
try {
    # Remember original location to restore it at the end
    $originalLocation = Get-Location
    
    # Setup backend
    $backendSuccess = Setup-Backend
    
    # Setup frontend
    $frontendSuccess = Setup-Frontend
    
    # Start services if setup was successful
    if ($backendSuccess -and $frontendSuccess) {
        Write-Host "`nSetup completed successfully!" -ForegroundColor Green
        
        # Ask if user wants to start the servers
        $startServers = Read-Host "Do you want to start the backend and frontend servers? (y/n)"
        
        if ($startServers -eq "y" -or $startServers -eq "Y") {
            Start-BackendServer
            Start-FrontendServer
            
            Write-Host "`nServers started successfully!" -ForegroundColor Green
            Write-Host "Backend running at: http://localhost:8000" -ForegroundColor Cyan
            Write-Host "Frontend running at: http://localhost:5173" -ForegroundColor Cyan
            Write-Host "API Documentation at: http://localhost:8000/docs" -ForegroundColor Cyan
        }
    } else {
        Write-Host "`nSetup failed. Please fix the issues above and try again." -ForegroundColor Red
    }
} finally {
    # Restore original location
    Set-Location -Path $originalLocation
}
