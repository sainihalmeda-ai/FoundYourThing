#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

[ -f backend/.env ] || cp backend/.env.example backend/.env
[ -f mobile/.env ] || cp mobile/.env.example mobile/.env

export CI=1

# Keep one foreground supervisor so Cursor's start process stays alive.
exec npx --yes concurrently -k -n api,web -c blue,magenta \
  "backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000" \
  "npm run web --prefix mobile -- --port 8081"
