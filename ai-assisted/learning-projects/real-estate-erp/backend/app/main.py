from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.database import SessionLocal
from app.core.exceptions import register_exception_handlers
from app.core.logging import get_logger, setup_logging
from app.services.auth_service import ensure_roles_and_permissions

settings = get_settings()
setup_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    logger.info("Starting %s in %s mode", settings.APP_NAME, settings.ENVIRONMENT)
    try:
        db = SessionLocal()
        try:
            ensure_roles_and_permissions(db)
        finally:
            db.close()
    except Exception as exc:
        logger.warning("Skipping startup role seed check (database may need migrations): %s", type(exc).__name__)
    yield
    logger.info("Shutting down %s", settings.APP_NAME)


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version="1.0.0",
        openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "X-Requested-With"],
    )

    register_exception_handlers(app)
    app.include_router(api_router, prefix=settings.API_V1_PREFIX)

    @app.get("/health", tags=["Health"])
    def health_check():
        db_ok = False
        try:
            db = SessionLocal()
            try:
                db.execute(text("SELECT 1"))
                db_ok = True
            finally:
                db.close()
        except Exception:
            db_ok = False
        return {
            "status": "healthy" if db_ok else "degraded",
            "database": "connected" if db_ok else "unavailable",
        }

    return app


app = create_app()
