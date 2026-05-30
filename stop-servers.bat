@echo off
echo ========================================
echo   Stopping E-Commerce Servers
echo ========================================
echo.

echo Stopping all node processes...
taskkill /F /IM node.exe 2>nul

echo.
echo ========================================
echo   All Servers Stopped!
echo ========================================
echo.
pause