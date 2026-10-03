# Kairo AI - Local Backend + Cloudflare Tunnel PowerShell Launcher
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "       KAIRO AI - Local Backend + Cloudflare Tunnel" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Activate Python virtual environment if found
if (Test-Path "$scriptDir\venv\Scripts\Activate.ps1") {
    Write-Host "[INFO] Activating virtual environment..." -ForegroundColor Green
    & "$scriptDir\venv\Scripts\Activate.ps1"
}

# Start backend in a new window
Write-Host "[1/2] Starting FastAPI backend on http://localhost:8000 ..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptDir\backend'; python -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload"

Write-Host "[2/2] Launching Cloudflare Tunnel for secure HTTPS access..." -ForegroundColor Yellow
Write-Host ""
Write-Host "--------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "Look below for your public HTTPS tunnel URL:" -ForegroundColor White
Write-Host "(Example: https://xyz-123.trycloudflare.com)" -ForegroundColor Cyan
Write-Host "Copy that URL and paste it into Kairo on Vercel!" -ForegroundColor Green
Write-Host "--------------------------------------------------------" -ForegroundColor DarkGray
Write-Host ""

npx --yes cloudflared tunnel --url http://localhost:8000
