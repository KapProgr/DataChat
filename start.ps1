$root = Split-Path -Parent $MyInvocation.MyCommand.Path

# Backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend'; python -m uvicorn app.main:app --reload"

# Frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\frontend'; npm run dev"

# Stripe CLI
Start-Process powershell -ArgumentList "-NoExit", "-Command", "stripe listen --forward-to localhost:8000/api/webhooks/stripe"

Write-Host "All services started!" -ForegroundColor Green
