# Egységes hibaválaszok az API végpontokhoz: {"code": "...", "message": "..."}

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


class AppError(Exception):
    def __init__(self, status_code: int, code: str, message: str):
        self.status_code = status_code
        self.code = code
        self.message = message


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def _app_error(_: Request, exc: AppError) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code, content={"code": exc.code, "message": exc.message}
        )

    @app.exception_handler(RequestValidationError)
    async def _validation_error(_: Request, exc: RequestValidationError) -> JSONResponse:
        errors = exc.errors()
        fields = {str(e["loc"][-1]) for e in errors if e.get("loc")}
        if "password" in fields:
            code, message = "weak_password", "Password must be between 8 and 128 characters."
        elif "email" in fields:
            code, message = "email_address_invalid", "Please enter a valid email address."
        else:
            code, message = "validation_failed", "Invalid request."
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            content={"code": code, "message": message, "errors": errors},
        )
