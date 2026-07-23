#!/usr/bin/env pwsh
Set-Location $PSScriptRoot
if (-not (Test-Path "venv")) {
  python -m venv venv
  & .\venv\Scripts\pip install -r requirements.txt
}
& .\venv\Scripts\Activate.ps1
if (-not (Test-Path ".env")) { Copy-Item .env.example .env }
New-Item -ItemType Directory -Force -Path uploads | Out-Null
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
