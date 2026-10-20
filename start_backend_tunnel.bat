@echo off
title Kairo AI Backend + Cloudflare Tunnel
color 0B

echo ========================================================
echo        KAIRO AI - Local Backend + Cloudflare Tunnel
echo ========================================================
echo.

set "ROOT_DIR=%~dp0"
cd /d "%ROOT_DIR%"

echo [1/2] Starting FastAPI backend on http://127.0.0.1:8000 ...
start "Kairo Backend (FastAPI)" cmd /k "cd /d "%ROOT_DIR%backend" && call "%ROOT_DIR%venv\Scripts\activate.bat" && python -m uvicorn app:app --host 127.0.0.1 --port 8000 --reload"

echo [Waiting 4s for FastAPI to bind to port 8000...]
timeout /t 4 /nobreak >nul

echo.
echo [2/2] Launching Cloudflare Tunnel for secure HTTPS access...
echo --------------------------------------------------------
echo Look below for your public HTTPS tunnel URL:
echo (It looks like: https://something-random.trycloudflare.com)
echo.
echo IMPORTANT: Copy the COMPLETE URL including the ".com" at the end!
echo Paste it into the Kairo UI on Vercel and click Save & Connect.
echo --------------------------------------------------------
echo.

cmd /c npx --yes cloudflared tunnel --url http://127.0.0.1:8000

pause
