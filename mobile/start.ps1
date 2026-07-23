#!/usr/bin/env pwsh
Set-Location $PSScriptRoot
if (-not (Test-Path ".env")) { Copy-Item .env.example .env }
npm start
