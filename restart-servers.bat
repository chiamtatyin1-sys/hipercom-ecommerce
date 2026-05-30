@echo off
echo ========================================
echo   Restarting E-Commerce Servers
echo ========================================
echo.

echo Stopping all servers...
taskkill /F /IM node.exe 2>nul

timeout /t 2 /nobreak >nul

echo Starting servers again...
start "Backend - Ecommerce" cmd /k "cd /d E:\ecomerce minimax\server && node src/index.js"

timeout /t 3 /nobreak >nul

start "Frontend - Ecommerce" cmd /k "cd /d E:\ecomerce minimax\client && npm run dev"

echo.
echo ========================================
echo   Servers Restarted!
echo ========================================
echo.
echo   Frontend: http://localhost:5174
echo   Backend:  http://localhost:3001
echo.
pause