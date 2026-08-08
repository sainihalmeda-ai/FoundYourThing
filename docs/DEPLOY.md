# Deploy

## Backend (Render)

1. Connect the GitHub repo at [dashboard.render.com](https://dashboard.render.com)
2. Use [`render.yaml`](../render.yaml) or create a Web Service with:
   - **Root directory:** `backend`
   - **Build:** `pip install -r requirements.txt`
   - **Start:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. Set env vars: `DATABASE_URL` (Supabase pooler), `SECRET_KEY` (long random), `UPLOAD_DIR=./uploads`, `CORS_ORIGINS=*`, plus `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` so photos survive restarts (see [SUPABASE.md](SUPABASE.md)#photos-supabase-storage)
4. Without Supabase Storage, free-tier uploads reset on redeploy. Paid alternative: attach a disk at `/var/data` and set `UPLOAD_DIR=/var/data/uploads`
5. Health: `https://YOUR-SERVICE.onrender.com/api/health`

## Database (Supabase)

See [SUPABASE.md](SUPABASE.md). Use the **Session pooler** URI with `sslmode=require`.

## Web (static)

```powershell
cd mobile
$env:EXPO_PUBLIC_API_URL="https://YOUR-SERVICE.onrender.com"
npm run export:web
# Deploy the `dist/` folder to Netlify / Cloudflare Pages
```

## Android APK (EAS)

1. Create a free Expo account at https://expo.dev/signup (GitHub login works).
2. From `mobile/`:

```powershell
cd mobile
npx eas-cli login
npx eas-cli init
npm run build:apk
```

3. When the cloud build finishes, open the Expo build page and **Download** the `.apk`.
4. On the phone: allow install from unknown sources → install the APK.

Or add an Expo access token as GitHub secret `EXPO_TOKEN`, then run the workflow
[`.github/workflows/eas-apk.yml`](../.github/workflows/eas-apk.yml) (Actions → Build Android APK → Run workflow).

`eas.json` preview profile already points `EXPO_PUBLIC_API_URL` at
`https://foundyourthing-api.onrender.com`.
