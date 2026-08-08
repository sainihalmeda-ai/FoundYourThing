# FoundYourThing — phone (Expo Go) starter
# Fixes the usual "Failed to download remote update" on Windows.

$ErrorActionPreference = "Continue"
Set-Location $PSScriptRoot

Write-Host ""
Write-Host "Opening Windows Firewall for Metro (8081) and API (8000)..." -ForegroundColor Cyan
netsh advfirewall firewall delete rule name="FYT Metro 8081" | Out-Null
netsh advfirewall firewall add rule name="FYT Metro 8081" dir=in action=allow protocol=TCP localport=8081 | Out-Null
netsh advfirewall firewall delete rule name="FYT API 8000" | Out-Null
netsh advfirewall firewall add rule name="FYT API 8000" dir=in action=allow protocol=TCP localport=8000 | Out-Null

$ips = Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object { $_.IPAddress -notlike '127.*' -and $_.PrefixOrigin -ne 'WellKnown' } |
  Select-Object -ExpandProperty IPAddress

Write-Host ""
Write-Host "Your PC LAN address(es):" -ForegroundColor Green
$ips | ForEach-Object { Write-Host "  $_" }
$primary = $ips | Select-Object -First 1
if ($primary) {
  Set-Content -Path ".env" -Value "EXPO_PUBLIC_API_URL=http://${primary}:8000" -Encoding ascii
  Write-Host ""
  Write-Host "Updated mobile/.env -> http://${primary}:8000" -ForegroundColor Green
  Write-Host ""
  Write-Host "On phone Expo Go, open:" -ForegroundColor Yellow
  Write-Host "  exp://${primary}:8081" -ForegroundColor White
  Write-Host ""
  Write-Host "If that fails, turn ON Mobile Hotspot on this PC," -ForegroundColor Yellow
  Write-Host "connect the phone to that hotspot, re-run this script," -ForegroundColor Yellow
  Write-Host "and use the new exp:// IP it prints." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Starting Expo (LAN, offline)..." -ForegroundColor Cyan
npx expo start --lan --offline --clear
