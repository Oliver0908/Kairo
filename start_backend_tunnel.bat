@echo off
title Kairo AI Backend + Cloudflare Tunnel
color 0B

echo ========================================================
echo        KAIRO AI - Local Backend + Cloudflare Tunnel
echo ========================================================
echo.

set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

if exist "%SCRIPT_DIR%venv\Scripts\activate.bat" (
    echo [INFO] Activating virtual environment...
    call "%SCRIPT_DIR%venv\Scripts\activate.bat"
) else (
    echo [WARN] venv not found. Using system Python...
)

echo.
echo [1/2] Starting FastAPI backend on http://localhost:8000 ...
start "Kairo Backend (FastAPI)" cmd /k "cd /d "%SCRIPT_DIR%backend" && python -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload"

echo [2/2] Launching Cloudflare Tunnel for secure HTTPS access...
echo.
echo --------------------------------------------------------
echo Look below for your public HTTPS tunnel URL:
echo (It looks like: https://something-random.trycloudflare.com)
echo.
echo Copy that URL and paste it into the Kairo UI on Vercel
echo by clicking the 'Backend Status' badge in the top navbar!
echo --------------------------------------------------------
echo.

cmd /c npx --yes cloudflared tunnel --url http://localhost:8000

pause
