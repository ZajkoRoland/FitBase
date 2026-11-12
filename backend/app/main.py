from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.db import engine
from app.db_schema_guard import ensure_per_account_schema
from app.errors import register_error_handlers
from app.routers import achievements, analytics, auth, coach, exercises, plan, profile, settings
from app.services.media import MEDIA_MOUNT, CachedStaticFiles


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    ensure_per_account_schema(engine)
    yield


app = FastAPI(title="FitBase API", version="0.2.0", lifespan=lifespan)

origins = get_settings().cors_origin_list
if origins:
    has_wildcard = "*" in origins
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"] if has_wildcard else origins,
        allow_credentials=not has_wildcard,
        allow_methods=["*"],
        allow_headers=["*"],
    )

register_error_handlers(app)

API_PREFIX = "/api/v1"
app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(profile.router, prefix=API_PREFIX)
app.include_router(settings.router, prefix=API_PREFIX)
app.include_router(achievements.router, prefix=API_PREFIX)
app.include_router(plan.router, prefix=API_PREFIX)
app.include_router(coach.router, prefix=API_PREFIX)
app.include_router(exercises.router, prefix=API_PREFIX)
app.include_router(analytics.router, prefix=API_PREFIX)

# Gyakoralt képek, kihagyja ha ha hiányzik a mappa.
media_dir = get_settings().media_dir
if media_dir.is_dir():
    app.mount(MEDIA_MOUNT, CachedStaticFiles(directory=media_dir), name="media")


@app.api_route("/health", methods=["GET", "HEAD"], tags=["meta"])
def health() -> dict[str, str]:
    return {"status": "ok"}
