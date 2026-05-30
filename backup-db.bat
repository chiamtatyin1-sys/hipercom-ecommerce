@echo off
echo ========================================
echo   HiperCom Database Backup
echo ========================================
echo.

set BACKUP_DIR=%~dp0docker-backups
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

set TIMESTAMP=%date:~-4,4%%date:~-7,2%%date:~-10,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
set BACKUP_FILE=%BACKUP_DIR%\hipercom_db_%TIMESTAMP%.sql

echo Backing up PostgreSQL database...
echo Output: %BACKUP_FILE%
echo.

docker exec hipercom-db pg_dump -U %DB_USER:-hipercom% -d %DB_NAME:-hipercom% -F c -f /tmp/backup.dump
docker cp hipercom-db:/tmp/backup.dump "%BACKUP_FILE%"
docker exec hipercom-db rm -f /tmp/backup.dump

if exist "%BACKUP_FILE%" (
    echo Backup successful: %BACKUP_FILE%
) else (
    echo ERROR: Backup failed!
)

echo.

REM Cleanup old backups (keep last 7)
echo Cleaning up old backups (keeping last 7)...
for /f "skip=7 delims=" %%f in ('dir /b /o-d "%BACKUP_DIR%\hipercom_db_*.sql" 2^>nul') do (
    del "%BACKUP_DIR%\%%f"
    echo Deleted: %%f
)

echo.
pause
