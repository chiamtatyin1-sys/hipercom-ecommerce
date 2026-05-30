@echo off
REM Automated database backup script
REM Run daily or manually to backup SQLite database

setlocal
set "SOURCE=E:\ecomerce minimax\dev.db"
set "BACKUP_DIR=E:\ecomerce minimax\backups"
set "DATE=%date:~-4%%date:~4,2%%date:~7,2%_%time:~0,2%%time:~3,2%"
set "BACKUP_FILE=%BACKUP_DIR%\dev.db.%DATE%"

REM Create backup directory if it doesn't exist
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

REM Copy database
echo Backing up database...
copy "%SOURCE%" "%BACKUP_FILE%"

echo Database backed up to: %BACKUP_FILE%

REM Keep only last 7 days of backups
echo Cleaning up old backups (keeping last 7 days)...
forfiles /p "%BACKUP_DIR%" /s /m "dev.db.*" /d -7 /c "cmd /c del @path"

echo Backup completed successfully!
endlocal
