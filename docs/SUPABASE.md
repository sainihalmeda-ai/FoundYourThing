# Connect FoundYourThing to Supabase

The FastAPI backend keeps using SQLAlchemy. Supabase is just the **Postgres host** — not Supabase Auth / client SDK.

## 1. Create a project

1. Open [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. **New project** → set a database password (save it)
3. Wait until the project is healthy

## 2. Copy the connection string

1. In the project, click **Connect**
2. Prefer **Session pooler** (port `5432`) on Windows / IPv4 networks
3. Copy the URI and replace `[YOUR-PASSWORD]`

Example shape:

```text
postgresql://postgres.abcdefghijklmnop:YOUR_PASSWORD@aws-0-ap-south-1.pooler.supabase.com:5432/postgres
```

Add `?sslmode=require` if it is not already there.

## 3. Point the backend at it

Edit `backend/.env`:

```env
DATABASE_URL=postgresql://postgres.YOUR_REF:YOUR_PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres?sslmode=require
```

Install the driver (once):

```powershell
cd backend
.\venv\Scripts\activate
pip install -r requirements.txt
```

Restart the API:

```powershell
powershell -ExecutionPolicy Bypass -File .\start.ps1
```

On startup, `Base.metadata.create_all` creates `users`, `items`, `matches`, and `claim_requests` in Supabase.

## 4. Verify

- API health: http://127.0.0.1:8000/api/health
- Supabase → **Table Editor** should show the four tables after the first successful start
- Register a test user with a `VTU…` or `TTS…` ID

## Security note

This app talks to Postgres **only through FastAPI** with its own JWT. Do **not** open these tables to the Supabase anon key without RLS. Keep the Data API locked down or enable RLS that denies public access.

## Photos

Item photos still live in `backend/uploads/` on the machine running FastAPI. Moving images to **Supabase Storage** is a separate step.
