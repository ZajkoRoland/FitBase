# FitBase API (FastAPI)

## Setup

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
copy .env.example .env   # kitölti a DATABASE_URL-t and JWT_SECRET-et
```

## Run

```powershell
.\.venv\Scripts\fastapi.exe dev app/main.py --host 0.0.0.0
```

- Swagger UI: http://localhost:8000/docs
- `--host 0.0.0.0` lets a phone running Expo Go reach the API via your PC's LAN IP.

## Test

```powershell
python run_tests.py
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

## AI Coach

The coach module uses Gemini and Groq API to generate workout plans and answer fitness-related questions.

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

