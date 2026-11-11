"""Exercise image URLs and the static file server behind them.

The catalogue stores relative paths such as 'images/flat/plank-main.webp'. Where those
files actually live (this server, a storage bucket, a CDN) is decided here, so moving
them never requires a database change.

Layout contract: <media base>/<relative path>. Served locally that is
    http://host:8000/media/images/flat/plank-main.webp
and a Supabase Storage bucket called 'media' holding an 'images' folder gives the same
shape under .../storage/v1/object/public/media/.
"""

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
    """StaticFiles plus a Cache-Control header; the images never change for a given name."""

    def file_response(self, full_path, stat_result, scope: Scope, status_code: int = 200):
        response = super().file_response(full_path, stat_result, scope, status_code)
        response.headers["Cache-Control"] = "public, max-age=604800"
        return response
