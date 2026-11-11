# FitBase API (FastAPI)

## Setup

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements-dev.txt
copy .env.example .env   # then fill in DATABASE_URL and JWT_SECRET
```

## Run

```powershell
.\.venv\Scripts\fastapi.exe dev app/main.py --host 0.0.0.0
```

- Swagger UI: http://localhost:8000/docs
- `--host 0.0.0.0` lets a phone running Expo Go reach the API via your PC's LAN IP.

## Test

```powershell
.\.venv\Scripts\python.exe -m pytest -q
```

## Endpoints (`/api/v1`)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/auth/register` | – | Create account (+ profile, stats), returns tokens |
| POST | `/auth/login` | – | Returns access + refresh token |
| POST | `/auth/refresh` | – | Rotates refresh token, returns new pair |
| POST | `/auth/logout` | – | Revokes a refresh token |
| GET | `/auth/username-available` | – | `?username=` check |
| GET | `/auth/me` | Bearer | Current user |
| GET / PATCH | `/profile` | Bearer | Profile + stats (flattened) |
| GET / PUT | `/plan` | Bearer | Weekly plan (upsert by `day_of_week`) |
| POST | `/coach/chat` | Bearer | AI Coach chat, consultative plan generation, granular workout modifications |
| GET | `/coach/context` | Bearer | Structured athlete profile & biometrics context snapshot for AI |
| GET | `/exercises` | Bearer | Exercise list: `q`, `body_part`, `difficulty`, `category`, `equipment`, `muscle`, `goal`, `lang`, `limit`, `offset` |
| GET | `/exercises/filters` | Bearer | Values for the filter chips |
| GET | `/exercises/{slug}` | Bearer | Full exercise: steps, tips, muscles, images |

## AI Coach Engine Architecture (Groq LPU)

The AI coach utilizes a resilient multi-model failover architecture powered by Groq Cloud:
- **Primary Model:** `openai/gpt-oss-120b` for deep contextual reasoning, structured workout generation, and science-grounded advice.
- **Fallback Model:** `openai/gpt-oss-20b` for instant failover when the primary model experiences transient errors or 429 rate limits.
- **Exponential Backoff:** Automatic 3-attempt retry loop with exponential backoff (`1.2s * attempt`) handling transient rate limits and network drops.
- **Granular Database Modifications:** Surgical operations (`replace_exercise`, `add_exercise`, `remove_exercise`, `update_exercise_parameters`, `swap_days`, `set_rest_day`, `generate_full_plan`) validated against actual exercise library records with full rollback protection.

Images are public files under `/media/images/...`, served from `MEDIA_DIR`
(default `../Gyakorlatok/images`). Set `MEDIA_BASE_URL` in `.env` (e.g. a public
Supabase Storage bucket URL ending in `/public/media/`) to serve them from elsewhere;
the database only stores relative paths, so nothing else changes.

Errors are always `{"code": "...", "message": "..."}`.

## Database migrations (Alembic)

The schema is owned by the revisions in `migrations/versions/`. The connection string
is read from `DATABASE_URL` in `backend/.env`.

```powershell
.\.venv\Scripts\alembic.exe upgrade head                 # apply everything
.\.venv\Scripts\alembic.exe current                      # which revision is the DB on
.\.venv\Scripts\alembic.exe revision -m "what changed"   # new empty revision
```

An older database whose tables were created from `db/init/001_schema.sql` must be
marked as being at the baseline once: `alembic stamp a1f3c9d27b40`.

## Database cutover

`supabase/migrations/0004_fastapi_auth.sql` copies `auth.users` into `public.users`
(same ids, existing bcrypt passwords keep working) and re-points `profiles` to it.
Run it only when the app is switched to this backend.

