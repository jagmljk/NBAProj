@echo off
title NBA Predictor

echo Starting NBA Predictor...
echo.

:: Start backend
echo Starting backend server...
start "NBA Backend" cmd /k "cd /d C:\Users\jagml\nbaprojv2\nba-predictor\backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8001"

:: Wait for backend to start
timeout /t 3 /nobreak >nul

:: Start frontend
echo Starting frontend...
start "NBA Frontend" cmd /k "cd /d C:\Users\jagml\nbaprojv2\nba-predictor\frontend && npm run dev"

:: Wait for frontend to start
timeout /t 5 /nobreak >nul

:: Open browser
echo Opening browser...
start http://localhost:5173

echo.
echo NBA Predictor is running!
echo - Backend: http://localhost:8001
echo - Frontend: http://localhost:5173
echo.
echo Close the terminal windows to stop the servers.
pause
