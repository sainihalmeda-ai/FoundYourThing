# Build a downloadable Android APK via EAS (cloud).
# Requires a free Expo account: https://expo.dev/signup

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host "Checking Expo login..." -ForegroundColor Cyan
$who = npx eas-cli whoami 2>$null
if (-not $who -or $who -match "Not logged in") {
  Write-Host ""
  Write-Host "You are not logged in to Expo." -ForegroundColor Yellow
  Write-Host "A browser window will open — sign in (GitHub works), then re-run this script." -ForegroundColor Yellow
  npx eas-cli login --browser
  exit 1
}

Write-Host "Logged in as: $who" -ForegroundColor Green

if (-not (Get-Content .\app.json | Select-String '"projectId": "[^"]+"')) {
  Write-Host "Linking EAS project..." -ForegroundColor Cyan
  npx eas-cli init --id --non-interactive 2>$null
  if ($LASTEXITCODE -ne 0) {
    npx eas-cli init
  }
}

Write-Host "Starting Android APK cloud build (preview profile)..." -ForegroundColor Cyan
npx eas-cli build -p android --profile preview --non-interactive

Write-Host ""
Write-Host "When the build finishes, download the APK from the Expo build URL printed above." -ForegroundColor Green
