# Publish a JS/asset update to phones already on the preview APK (EAS Update).
# Usage: .\publish-update.ps1 "Fix email validation"
# Requires: one APK built AFTER expo-updates was added (same runtimeVersion / app version).

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$msg = $args[0]
if (-not $msg) {
  $msg = "FYT update $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
}

$env:NODE_TLS_REJECT_UNAUTHORIZED = "0"
Write-Host "Publishing OTA update to channel 'preview'..." -ForegroundColor Cyan
npx eas-cli update --channel preview --message "$msg" --non-interactive
Write-Host "Done. Users get it the next time they open FYT." -ForegroundColor Green
