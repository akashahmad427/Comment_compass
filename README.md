# Comment Compass: YouTube comment insights for creators

Paste a video link, get sentiment (positive / negative / neutral), what viewers ask for, and concrete tips to improve the next video.

**Stack:** FastAPI · PostgreSQL · React (Vite) · Docker · VADER sentiment (free, light)

## Run locally with Docker
```bash
cp backend/.env.example backend/.env      # add your YOUTUBE_API_KEY and a SECRET_KEY
docker compose up --build
# Web: http://localhost:3000   API docs: http://localhost:8000/docs
```

## Run without Docker
```bash
cd backend && pip install -r requirements.txt
export YOUTUBE_API_KEY=... SECRET_KEY=dev      # uses SQLite if DATABASE_URL is unset
uvicorn app.main:app --reload
cd ../frontend && npm install && npm run dev   # http://localhost:5173
```

## Deploy for free
1. **Database:** create a free project on [Neon](https://neon.tech), copy the connection string.
2. **API:** push this repo to GitHub, then on [Render](https://render.com) create a Blueprint from `render.yaml`. Set `DATABASE_URL`, `YOUTUBE_API_KEY`, and `CORS_ORIGINS` (your Vercel URL).
3. **Frontend:** on [Vercel](https://vercel.com) import the repo, set Root Directory to `frontend`, add env var `VITE_API_URL` = your Render URL.
4. Optional: ping `/health` every 10 minutes with UptimeRobot to reduce Render free-tier cold starts.

## Scaling to 10,000 users
- Analyses are cached per user/video for 24h and capped (`DAILY_LIMIT`, `MAX_COMMENTS`) to protect the YouTube quota (10,000 units/day ≈ 1,000 videos).
- Background jobs run in-process now. When traffic grows, move `run_analysis` to Celery/RQ + Redis (Upstash) and add more API instances.
- Add Alembic migrations, Sentry for errors, and a paid plan (Stripe/LemonSqueezy) with higher limits.
