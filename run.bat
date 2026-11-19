@echo off
title Water Supply Portal Launcher
echo ========================================================
echo  Starting Water Supply Complaint ^& Monitoring Portal
echo ========================================================
echo.
echo Starting Backend API Server (Port 5000)...
start "Water Portal - Backend (Port 5000)" cmd /k "cd backend && node index.js"

echo Starting Frontend Dev Server (Port 3000)...
start "Water Portal - Frontend (Port 3000)" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================================
echo  Both servers are starting up!
echo  Open http://localhost:3000 in your browser.
echo ========================================================
pause
