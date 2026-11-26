from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError

from app.core.logging import get_logger

logger = get_logger(__name__)


class AppException(Exception):
    def __init__(self, message: str, status_code: int = 400, code: str = "BAD_REQUEST"):
        self.message = message
        self.status_code = status_code
        self.code = code
        super().__init__(message)


class UnauthorizedError(AppException):
    def __init__(self, message: str = "Authentication required."):
        super().__init__(message, status.HTTP_401_UNAUTHORIZED, "UNAUTHORIZED")


class ForbiddenError(AppException):
    def __init__(self, message: str = "You do not have permission to perform this action."):
        super().__init__(message, status.HTTP_403_FORBIDDEN, "FORBIDDEN")


class NotFoundError(AppException):
    def __init__(self, message: str = "Requested resource was not found."):
        super().__init__(message, status.HTTP_404_NOT_FOUND, "NOT_FOUND")


class ConflictError(AppException):
    def __init__(self, message: str = "Resource conflict occurred."):
        super().__init__(message, status.HTTP_409_CONFLICT, "CONFLICT")


class BusinessRuleError(AppException):
    def __init__(self, message: str = "Business rule validation failed."):
        super().__init__(message, status.HTTP_400_BAD_REQUEST, "BUSINESS_RULE_VIOLATION")


class RateLimitError(AppException):
    def __init__(self, message: str = "Too many requests. Please try again later."):
        super().__init__(message, status.HTTP_429_TOO_MANY_REQUESTS, "RATE_LIMIT_EXCEEDED")


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppException)
    async def handle_app_exception(_request: Request, exc: AppException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.message, "code": exc.code},
        )

    @app.exception_handler(RequestValidationError)
    async def handle_validation_exception(_request: Request, exc: RequestValidationError):
        errors = []
        for err in exc.errors():
            loc = ".".join(str(x) for x in err.get("loc", []) if x != "body")
            errors.append({"field": loc, "message": err.get("msg", "Invalid value")})
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "detail": "Input validation failed.",
                "code": "VALIDATION_ERROR",
                "errors": errors,
            },
        )

    @app.exception_handler(IntegrityError)
    async def handle_integrity_error(_request: Request, exc: IntegrityError):
        logger.warning("Database integrity error: %s", str(exc.orig))
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={
                "detail": "Operation conflicts with an existing record or constraint.",
                "code": "INTEGRITY_CONFLICT",
            },
        )

    @app.exception_handler(Exception)
    async def handle_unexpected_exception(_request: Request, exc: Exception):
        logger.exception("Unhandled server exception: %s", type(exc).__name__)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "detail": "An unexpected internal error occurred.",
                "code": "INTERNAL_SERVER_ERROR",
            },
        )
