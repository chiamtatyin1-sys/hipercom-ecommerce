@echo off
echo ========================================
echo   HiperCom Production Deploy (QNAP)
echo ========================================
echo.

REM Check if .env exists
if not exist .env (
    echo ERROR: .env file not found!
    echo Copy .env.production to .env and fill in your values first.
    echo.
    pause
    exit /b 1
)

echo [1/5] Loading environment...
echo.

echo [2/5] Building Docker images...
docker-compose build --no-cache
if errorlevel 1 (
    echo ERROR: Docker build failed!
    pause
    exit /b 1
)
echo.

echo [3/5] Starting PostgreSQL...
docker-compose up -d db
echo Waiting for database to be ready...
timeout /t 15 /nobreak >nul
echo.

echo [4/5] Running database migrations...
docker-compose run --rm server npx prisma migrate deploy
if errorlevel 1 (
    echo ERROR: Migration failed!
    pause
    exit /b 1
)
echo.

echo [5/5] Starting all services...
docker-compose up -d
echo.

echo ========================================
echo   Deployment Complete!
echo ========================================
echo.
echo   Frontend: http://YOUR_QNAP_IP:5173
echo   Backend:  http://YOUR_QNAP_IP:3001
echo   Admin:    http://YOUR_QNAP_IP:5173/admin
echo.
echo   Login: hipercom / (your admin password)
echo.
echo   Useful commands:
echo     docker-compose logs -f        - View logs
echo     docker-compose down           - Stop all services
echo     docker-compose ps             - Check status
echo     docker-compose restart        - Restart services
echo.
pause
