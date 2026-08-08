# Deploy

## Backend (Render)

1. Connect the GitHub repo at [dashboard.render.com](https://dashboard.render.com)
2. Use [`render.yaml`](../render.yaml) or create a Web Service with:
   - **Root directory:** `backend`
   - **Build:** `pip install -r requirements.txt`
   - **Start:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. Set env vars: `DATABASE_URL` (Supabase pooler), `SECRET_KEY` (long random), `UPLOAD_DIR=./uploads`, `CORS_ORIGINS=*`
4. Free tier: uploads reset on redeploy. Paid: attach disk at `/var/data` and set `UPLOAD_DIR=/var/data/uploads`
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

```powershell
cd mobile
npm install -g eas-cli
eas login
eas init
npm run build:apk
```

Download the APK from the EAS build page. Preview profile embeds `EXPO_PUBLIC_API_URL` from [`mobile/eas.json`](../mobile/eas.json).
