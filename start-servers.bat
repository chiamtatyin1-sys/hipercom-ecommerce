@echo off
echo ========================================
echo   E-Commerce Server Starter
echo ========================================
echo.

echo [1/2] Starting Backend Server (Port 3001)...
start "Backend - Ecommerce" cmd /k "cd /d E:\ecomerce minimax\server && node src/index.js"

timeout /t 3 /nobreak >nul

echo [2/2] Starting Frontend Server (Port 5174)...
start "Frontend - Ecommerce" cmd /k "cd /d E:\ecomerce minimax\client && npm run dev"

echo.
echo ========================================
echo   Servers Started Successfully!
echo ========================================
echo.
echo   Frontend: http://localhost:5174
echo   Backend:  http://localhost:3001
echo.
echo   Login: hipercom / Hipercom123#
echo.
echo   Press any key to close this window...
pause >nul