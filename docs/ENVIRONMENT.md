# Environment & Operations

What's already live, and how to ship changes going forward. For first-time setup
of each piece, see [DEPLOY.md](DEPLOY.md) and [SUPABASE.md](SUPABASE.md) — this
doc assumes that's done and focuses on day-to-day operation.

## What's live

| Piece | Where | Notes |
|---|---|---|
| API | `foundyourthing-api` on [Render](https://dashboard.render.com) | FastAPI, region Singapore, config in [`render.yaml`](../render.yaml) |
| Web + APK download | `foundyourthing-web` on Render | Static export of `mobile/` (`expo export --platform web`) |
| Database | Supabase project `jfuasntyyofloecifwmo` (ap-southeast-1) | Postgres only — accessed via SQLAlchemy, not the Supabase SDK. See [SUPABASE.md](SUPABASE.md) |
| Mobile app | Expo/EAS project `foundyourthing` (`meda_sai_nihal` account, id `c42fe662-06fd-4195-aa8e-1cf332b5cb2b`) | `eas-cli` is already authenticated on this machine — `npx eas-cli whoami` returns `meda_sai_nihal` with no login step needed |

## How future changes ship

### Backend / web export (Render)
`render.yaml` is a Render **Blueprint**. Push to `main` → Render rebuilds both
services automatically, *if* each service has **Auto-Deploy: Yes** (Render
dashboard → service → Settings → Build & Deploy). Verify this once per
service; it's not something the repo can enforce.

`DATABASE_URL` is marked `sync: false` in `render.yaml`, meaning Render will
**not** pull it from the repo — it must already be pasted into each Render
service's dashboard (Environment tab) by hand. If the API ever fails to boot
after a deploy, check that value first.

### Mobile app (Expo/EAS)
Two paths depending on what changed:

- **JS/TS-only change** (screens, logic, styling) → ship an OTA update, no
  rebuild or app-store step:
  ```powershell
  cd mobile
  npm run update:preview      # publishes to the "preview" channel
  npm run update:production   # publishes to "production"
  ```
  Only the `preview` channel has ever been published to
  (`npx eas-cli channel:list`) — `production` gets created the first time
  `update:production` runs or a production build is made.

- **Native change** (new permission/module, `app.json` bump, new asset) →
  needs a fresh binary:
  ```powershell
  cd mobile
  npm run build:apk           # eas build -p android --profile preview
  ```
  Or run the existing [`eas-apk.yml`](../.github/workflows/eas-apk.yml)
  workflow from GitHub Actions (needs the `EXPO_TOKEN` secret below).

### CI: automatic OTA on push
[`.github/workflows/eas-update.yml`](../.github/workflows/eas-update.yml)
publishes an OTA update to the `preview` channel whenever `mobile/**` changes
land on `main`, so day-to-day JS changes don't need a manual `eas update`.
It can also be run manually (`workflow_dispatch`) against `preview` or
`production`. Requires the `EXPO_TOKEN` secret (see below).

## One-time secrets to set

- [ ] **GitHub repo → Settings → Secrets and variables → Actions → `EXPO_TOKEN`**
      Generate at https://expo.dev/accounts/meda_sai_nihal/settings/access-tokens.
      Needed by both `eas-apk.yml` and the new `eas-update.yml` workflow.
- [ ] **Render → foundyourthing-api → Environment → `DATABASE_URL`**
      The Supabase pooler URI (see local `backend/.env` for the shape, or
      [SUPABASE.md](SUPABASE.md)). Confirm this is actually set — `render.yaml`
      deliberately doesn't carry the value.
- [ ] *(optional)* **Render → foundyourthing-api → `SUPABASE_URL` /
      `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_STORAGE_BUCKET`** — item photos
      are already durable without this (stored as bytes in Postgres, see
      `backend/app/services/storage.py`); setting these additionally mirrors
      new uploads into Supabase Storage instead of the Postgres row, which is
      lighter on the database. Not required for correctness today.

## CLI access reference (for running things from a terminal/agent)

| Tool | Status on this machine | Non-interactive auth (for CI or a fresh machine) |
|---|---|---|
| `eas-cli` (Expo) | Already logged in (`npx eas-cli whoami`) | `EXPO_TOKEN` env var |
| Render CLI | Not installed — not needed day-to-day since deploys are git-push driven. Install with `npm i -g @render-oss/cli`, then `render login` (opens a browser once) if you want to tail logs or manage services from a terminal. | `RENDER_API_KEY` env var (Render → Account Settings → API Keys) |
| Supabase CLI | Not installed — the backend talks to Postgres directly, so it's only useful for managing Storage/buckets from a terminal. Install with `npm i -g supabase`, then `supabase login`. | `SUPABASE_ACCESS_TOKEN` env var (Supabase → Account → Access Tokens) |

Browser-based logins (`render login`, `supabase login`) have to be run
interactively by a human once — they can't be completed by an agent. The
access-token route (right column above) is what lets a CI job or a future
agent session act non-interactively instead.

## Local dev env files (gitignored, not synced anywhere)

- `backend/.env` — already points at the live Supabase Postgres instance
  (not the sqlite default in `.env.example`). Safe to also flip back to
  `DATABASE_URL=sqlite:///./foundyourthing.db` for offline work.
- `mobile/.env` — `EXPO_PUBLIC_API_URL` is set to a LAN IP for phone testing
  over Expo Go. Change it per network (see table in the main
  [README](../README.md#3-start-the-mobile-app)); it has no effect on
  built/OTA'd apps, which get their API URL baked in from `eas.json`.
