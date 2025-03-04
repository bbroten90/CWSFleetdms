# CWS Fleet Management System
# Startup Script (PowerShell) with Virtual Environment

Write-Host "===== CWS Fleet Management System =====" -ForegroundColor Green
Write-Host "This script will install dependencies and start the application" -ForegroundColor Green

# Force close any existing instances
Write-Host "`n`n===== Closing Existing Instances =====" -ForegroundColor Yellow
Write-Host "Closing any existing Node.js/Vite processes..." -ForegroundColor Yellow

# More direct approach using taskkill
cmd /c "taskkill /f /im node.exe 2>nul" 
Write-Host "Node.js processes terminated" -ForegroundColor Yellow

Write-Host "Closing any existing Python/uvicorn processes..." -ForegroundColor Yellow
cmd /c "taskkill /f /im python.exe 2>nul"
cmd /c "taskkill /f /im pythonw.exe 2>nul"
Write-Host "Python processes terminated" -ForegroundColor Yellow

# Set working directory to the project root
Set-Location -Path $PSScriptRoot

# Create and activate virtual environment
Write-Host "`n`n===== Creating Python Virtual Environment =====" -ForegroundColor Green
python -m venv venv
& .\venv\Scripts\Activate.ps1
python -m pip install --upgrade pip

# Install backend dependencies
Write-Host "`n`n===== Installing Backend Dependencies =====" -ForegroundColor Green
Set-Location -Path "backend"
pip install fastapi uvicorn sqlalchemy psycopg2-binary pydantic python-jose[cryptography] passlib[bcrypt] python-multipart

# Run the test data script to populate the database
Write-Host "`n`n===== Populating Database with Test Data =====" -ForegroundColor Green
python test-data-script.py

# Start the backend server in the background
Write-Host "`n`n===== Starting Backend Server =====" -ForegroundColor Green
$backendJob = Start-Job -ScriptBlock { 
    Set-Location -Path $using:PWD
    & "$using:PSScriptRoot\venv\Scripts\python.exe" main.py
}
Write-Host "Backend server started as job: $($backendJob.Id)" -ForegroundColor Green

# Install frontend dependencies
Write-Host "`n`n===== Installing Frontend Dependencies =====" -ForegroundColor Green
Set-Location -Path "../fleet-dms-frontend"
npm install
npm install -D tailwindcss autoprefixer postcss

# Start the frontend server
Write-Host "`n`n===== Starting Frontend Server =====" -ForegroundColor Green
npm run dev

# Cleanup function to stop the backend job when the script exits
$backendJob | Stop-Job
$backendJob | Remove-Job
Write-Host "`n`n===== Servers Shut Down =====" -ForegroundColor Green
deactivate
Write-Host "Virtual environment deactivated" -ForegroundColor Green
