@echo off
cd /d "%~dp0"
set "ASTRO_TELEMETRY_DISABLED=1"
where npm.cmd >nul 2>nul
if errorlevel 1 (
  echo Node.js / npm was not found. Install Node.js and try again.
  pause
  exit /b 1
)
if not exist "node_modules\astro\package.json" (
  echo Dependencies are missing. Run npm ci in this folder first.
  pause
  exit /b 1
)
if not exist "dist\index.html" (
  call npm.cmd run build
  if errorlevel 1 (
    pause
    exit /b 1
  )
)
echo Local website: http://127.0.0.1:4322/
echo Keep this window open while browsing. Press Ctrl+C to stop.
echo This previews the last build. After editing, run npm run build first.
call npm.cmd run preview -- --host 127.0.0.1 --port 4322
pause
