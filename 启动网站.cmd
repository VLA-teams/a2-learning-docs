@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Please install Node.js 22 first.
  pause
  exit /b 1
)
if not exist node_modules call npm ci
if errorlevel 1 (
  pause
  exit /b 1
)
echo Open the local URL shown below. Keep this window open while previewing.
call npm run docs:dev
pause
