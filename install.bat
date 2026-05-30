@echo off
echo ========================================
echo   Installing Dependencies
echo ========================================
echo.

echo [1/3] Installing root dependencies...
cd /d E:\ecomerce minimax
call npm install 2>nul

echo [2/3] Installing server dependencies...
cd /d E:\ecomerce minimax\server
call npm install 2>nul

echo [3/3] Installing client dependencies...
cd /d E:\ecomerce minimax\client
call npm install 2>nul

echo.
echo ========================================
echo   Installation Complete!
echo ========================================
echo.
echo   Run start-servers.bat to start the app
echo.
pause