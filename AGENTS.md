# FoundYourThing

AI-powered, privacy-first campus lost & found. Two services in one repo:

- `backend/` — FastAPI REST API + local AI matching (SQLite dev DB, embedded — no separate DB service). Runs on port `8000`.
- `mobile/` — Expo (React Native 0.81 / SDK 54) client that also runs in the browser via react-native-web. Metro/web dev server on port `8081`.

No Docker, Makefile, or external services/API keys are needed for local dev. See `README.md` for the product overview and API endpoint list.

## Cursor Cloud specific instructions

The startup update script already installs backend Python deps (into `backend/venv`), installs mobile npm deps, and creates both `.env` files from their `.env.example` templates. Standard run commands live in `README.md`; notes below are the non-obvious caveats.

### Running the services

- Backend (from `backend/`): activate the venv first, then run uvicorn. The venv is required — `python3 -m venv` needs the system package `python3-venv` (already present in the environment snapshot):
  - `source venv/bin/activate && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`
  - Health check: `curl http://127.0.0.1:8000/api/health` → `{"status":"ok",...}`. Interactive docs at `/docs`.
- Mobile web (from `mobile/`): `npm run web` (i.e. `expo start --web`). First bundle takes ~10-30s. Serves on `http://localhost:8081`.
  - `npm run web` runs an interactive Metro terminal UI; run it in a long-lived session (e.g. tmux), not as a blocking foreground call.
  - Passing `CI=1` disables Metro watch/hot-reload — omit it for normal dev.
- Long-running processes (uvicorn, Expo) should be started in tmux (`-f /exec-daemon/tmux.portal.conf`) so they survive across commands.

### Non-obvious notes

- The client resolves the backend via `EXPO_PUBLIC_API_URL` (defaults to `http://127.0.0.1:8000` in `src/constants/config.ts`). Both `.env` files are optional because the backend (`app/config.py`) and client both have safe in-code defaults, but the update script still creates them. Restart Expo after editing `mobile/.env` — env vars are inlined at bundle start.
- SQLite DB file (`backend/foundyourthing.db`), `backend/uploads/`, and `.env` files are gitignored. The DB is auto-created on backend startup (`Base.metadata.create_all`) and, on boot, `refresh_embeddings_and_scores` recomputes match scores over existing items — expect a brief startup pass.
- Session tokens are short-lived by design: `ACCESS_TOKEN_EXPIRE_MINUTES=10` (backend) and `SESSION_DURATION_MS` (client) must stay in sync. Expect re-login prompts during long manual test sessions.
- Reporting an item requires a photo. On web the "Gallery" button opens a file-picker (there is no Camera button on web); provide an image file path to upload.

### Lint / test / build

- There is no automated test suite and no configured linter.
- Type/compile checks used as lint: mobile `npx tsc --noEmit` (from `mobile/`); backend `python -m compileall app` (from `backend/`, venv active).
