@echo off
title Kairo AI Backend + Cloudflare Tunnel
color 0B

echo ========================================================
echo        KAIRO AI - Local Backend + Cloudflare Tunnel
echo ========================================================
echo.

set "ROOT_DIR=%~dp0"

echo [1/2] Starting FastAPI backend on http://127.0.0.1:8000 ...
start "Kairo Backend (FastAPI)" "%ROOT_DIR%venv\Scripts\python.exe" -m uvicorn app:app --app-dir "%ROOT_DIR%backend" --host 127.0.0.1 --port 8000 --reload

echo [Waiting 4s for FastAPI to bind to port 8000...]
timeout /t 4 /nobreak >nul

echo.
echo [2/2] Launching Cloudflare Tunnel for secure HTTPS access...
echo --------------------------------------------------------
echo Look below for your public HTTPS tunnel URL:
echo (It looks like: https://something-random.trycloudflare.com)
echo.
echo IMPORTANT: Copy the COMPLETE URL including the ".com" at the end!
echo --------------------------------------------------------
echo.

cmd /c npx --yes cloudflared tunnel --url http://127.0.0.1:8000

pause
