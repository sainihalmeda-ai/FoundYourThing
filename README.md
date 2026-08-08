# FoundYourThing

**AI-Powered Privacy-First Campus Lost & Found System**  
*(Lost on campus. Found by intelligence.)*  
*(Campus lost & found, reimagined for students.)*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-FastAPI-3776AB?logo=python&logoColor=white)](https://fastapi.tiangolo.com/)
[![Expo](https://img.shields.io/badge/Expo-React%20Native-000020?logo=expo&logoColor=white)](https://expo.dev/)
[![SDG 11](https://img.shields.io/badge/SDG-11%20Sustainable%20Cities-green)](#sdg-alignment)

> A smart campus platform where students report lost or found **valuable items**, AI suggests possible matches, and contact details are shared **only with mutual consent**.

**Repository:** [github.com/sainihalmeda-ai/FoundYourThing](https://github.com/sainihalmeda-ai/FoundYourThing)

---

## About

Every day on college campuses, students lose phones, watches, wallets, ID cards, and bags. Notice boards and WhatsApp groups are slow and unstructured.

**FoundYourThing** solves this with:

- **AI-based image + text matching** between lost and found reports
- **Privacy-first identity** — VTU/college ID shown first; phone shared only after both parties agree
- **Valuables-only policy** — pens, pencils, and small stationery are rejected
- **Cross-platform app** — Android, iOS (Expo Go), and web browser

| Field | Value |
|-------|-------|
| **Project Category** | AI & Mobile-based Smart Campus Application |
| **Major Area (Domain)** | Artificial Intelligence (AI) |
| **SDG** | 11 — Sustainable Cities and Communities |

---

## Features

- Register / login with campus VTU ID
- Report **lost** or **found** valuable items with photo
- AI match suggestions with confidence score (%)
- Campus feed to browse open reports
- Privacy-gated claim flow (owner requests → finder accepts/rejects)
- Connection status banner (offline / server down / retry)
- Session handling and clear error states on mobile & web
- REST API with interactive docs at `/docs`

---

## Privacy Model

| Stage | What others see |
|-------|-----------------|
| **Public** | VTU ID + item photo + location |
| **Match** | VTU ID + match score (involved users) |
| **Claim** | Masked name + department |
| **Connected** | Full name + phone (after finder **accepts**) |

Phone numbers are **never** auto-shared.

---

## Valuables-Only Policy

**Accepted:** mobile phone, laptop/tablet, watch, wallet, ID card, bag, keys, earbuds, spectacles, other valuable.

**Rejected:** pen, pencil, eraser, small stationery.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Mobile | React Native (Expo 54) + TypeScript |
| Backend | Python 3 + FastAPI |
| Database | SQLite (dev) → PostgreSQL (production) |
| AI Matching | Image + text embeddings (MVP; CLIP upgrade planned) |
| Auth | JWT tokens |
| Storage | Local uploads (dev) → cloud storage (production) |

---

## Who can register

Only college identity numbers are accepted, and the prefix decides the role:

| Prefix | Who | Role stored |
|--------|-----|-------------|
| `VTU` | Students | `student` |
| `TTS` | Staff | `staff` |

Any other ID is refused at registration and at login. The rule lives in
`backend/app/services/campus_id.py` and is mirrored on the client in
`mobile/src/lib/validation.ts` — change both together.

## Project Structure

```
FoundYourThing/
├── backend/                 # FastAPI API + AI matching + privacy logic
│   ├── app/
│   │   ├── routers/         # auth, items, claims
│   │   └── services/        # embeddings, matching, privacy
│   ├── requirements.txt
│   └── start.ps1 / start.bat
├── mobile/                  # Expo React Native app
│   ├── src/
│   │   ├── screens/         # Home, Report, Feed, Claims, etc.
│   │   ├── components/      # UI + connection/session states
│   │   └── api/             # API client
│   └── package.json
└── docs/
    ├── ARCHITECTURE.md
    ├── CONNECTION.md
    └── GITHUB.md
```

---

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- npm or yarn
- Expo Go app (for phone testing)

### 1. Clone the repository

```bash
git clone https://github.com/sainihalmeda-ai/FoundYourThing.git
cd FoundYourThing
```

### 2. Start the backend

**Linux / macOS:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Windows (PowerShell):**
```powershell
cd backend
.\start.ps1
```

API docs: **http://127.0.0.1:8000/docs**  
Health check: **http://127.0.0.1:8000/api/health**

### 3. Start the mobile app

**Browser (easiest for PC):**
```bash
cd mobile
npm install
cp .env.example .env
# Set EXPO_PUBLIC_API_URL=http://127.0.0.1:8000 in .env
npm run web
```

**Phone (Expo Go):**
```bash
cd mobile
npm install
npm start
```

Set `EXPO_PUBLIC_API_URL` in `mobile/.env`:

| Environment | API URL |
|-------------|---------|
| PC browser | `http://127.0.0.1:8000` |
| Android emulator | `http://10.0.2.2:8000` |
| Physical phone (same Wi‑Fi) | `http://YOUR_PC_LAN_IP:8000` |

See [docs/CONNECTION.md](docs/CONNECTION.md) for troubleshooting.

---

## Demo Flow (2 accounts)

1. **Account A** — Register → **I lost something** → upload watch photo → submit  
2. **Account B** — Register → **I found something** → upload similar photo → submit  
3. **Account A** — Open lost item → see **AI possible match (%)**  
4. **Account A** — Tap **This is mine — request contact**  
5. **Account B** — **Incoming contact requests** → **Accept**  
6. Both accounts now see phone numbers

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Server health check |
| `POST` | `/api/auth/register` | Create account |
| `POST` | `/api/auth/login` | Login |
| `GET` | `/api/items` | List open reports |
| `POST` | `/api/items` | Report lost/found item |
| `GET` | `/api/items/{id}/matches` | AI match suggestions |
| `POST` | `/api/claims` | Owner requests contact |
| `POST` | `/api/claims/{id}/respond` | Finder accepts/rejects |

---

## SDG Alignment

**SDG 11: Sustainable Cities and Communities**

FoundYourThing supports safer, more organized campus communities by helping students recover lost valuables through a trusted digital platform with privacy-preserving contact sharing.

---

## Roadmap

- [ ] Push notifications for urgent lost valuables
- [ ] Campus broadcast alerts (valuables only)
- [ ] Upgrade AI to CLIP + sentence-transformers
- [ ] College SSO / verified VTU ID integration
- [ ] Admin moderation dashboard
- [ ] Deploy backend (Render) + PostgreSQL + cloud image storage

---

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Server connection guide](docs/CONNECTION.md)
- [GitHub workflow](docs/GITHUB.md)

---

## Author

**Meda Sai Nihal** — CSE (AI & Data Science)  
GitHub: [@sainihalmeda-ai](https://github.com/sainihalmeda-ai)

---

## License

MIT — see [LICENSE](mobile/LICENSE) for details.
