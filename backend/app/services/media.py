# Gyakorlat képek és statikus fájlkiszolgáló

from fastapi import Request
from starlette.staticfiles import StaticFiles
from starlette.types import Scope

from app.config import get_settings

MEDIA_MOUNT = "/media/images"


class MediaUrls:
    def __init__(self, base_url: str) -> None:
        self.base_url = base_url.rstrip("/") + "/"

    @classmethod
    def from_request(cls, request: Request) -> "MediaUrls":
        configured = get_settings().media_base_url.strip()
        # request.base_url already ends with '/', and follows whatever host the phone used
        # (10.0.2.2 on the emulator, the LAN address on a real device).
        return cls(configured or f"{request.base_url}media/")

    def url(self, path: str | None) -> str | None:
        return f"{self.base_url}{path.lstrip('/')}" if path else None


class CachedStaticFiles(StaticFiles):
    # Statikus fájlkiszolgáló Cache-Control fejléccel

    def file_response(self, full_path, stat_result, scope: Scope, status_code: int = 200):
        response = super().file_response(full_path, stat_result, scope, status_code)
        response.headers["Cache-Control"] = "public, max-age=604800"
        return response
