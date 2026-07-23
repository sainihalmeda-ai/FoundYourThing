# FoundYourThing

AI-powered campus lost & found for **valuable items only**, with privacy-first contact sharing.

## Stack

| Layer | Tech |
|-------|------|
| Mobile | React Native (Expo) + TypeScript |
| Backend | Python FastAPI |
| Database | SQLite (dev) → PostgreSQL (production) |
| AI matching | Image + text embeddings (MVP); upgrade path to CLIP |

## Privacy model

1. **Public** — only `VTU27680`-style ID on reports
2. **Match** — involved parties see match score + VTU ID
3. **Claim** — masked name + department on contact request
4. **Connected** — phone shared only after finder **accepts** owner request

## Valuables-only policy

Accepted: phone, laptop, watch, wallet, ID card, bag, keys, earbuds, spectacles.

Rejected: pens, pencils, erasers, small stationery.

## Project structure

```
foundyourthing/
├── backend/          FastAPI API + AI matching
├── mobile/           Expo app (Android / iOS)
└── docs/             Architecture & connection guide
```

## Quick start

### 1. Backend

```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API docs: http://127.0.0.1:8000/docs

### 2. Mobile app

```powershell
cd mobile
copy .env.example .env
npm start
```

Scan the QR code with **Expo Go** on your phone.

### 3. Connect phone to backend

See [docs/CONNECTION.md](docs/CONNECTION.md) for full details.

| Device | `EXPO_PUBLIC_API_URL` |
|--------|------------------------|
| Windows + Android emulator | `http://10.0.2.2:8000` |
| iOS simulator (Mac) | `http://127.0.0.1:8000` |
| Physical phone (same Wi‑Fi) | `http://YOUR_PC_LAN_IP:8000` |

Find your PC IP: `ipconfig` → IPv4 Address (e.g. `192.168.1.42`).

## Connection UX (built into the app)

- **Connection banner** when offline or server is down
- **Retry** button on banner and error screens
- **15s timeout** with automatic retries on transient failures
- **Clear errors** for offline, timeout, server, and session expiry

## GitHub workflow

After each feature milestone:

```powershell
git add .
git commit -m "Describe the change"
git push origin main
```

Create the remote repo on GitHub, then:

```powershell
git remote add origin https://github.com/YOUR_USERNAME/foundyourthing.git
git branch -M main
git push -u origin main
```

## Roadmap

- [ ] Push notifications for urgent lost valuables
- [ ] Upgrade embeddings to CLIP + sentence-transformers
- [ ] College SSO / VTU ID verification API
- [ ] Admin moderation panel
- [ ] Deploy backend to Render + DB to PostgreSQL

## License

MIT — campus project use.
