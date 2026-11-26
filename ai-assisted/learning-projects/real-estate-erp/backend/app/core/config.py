from functools import lru_cache
import secrets
from typing import List
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    ENVIRONMENT: str = "development"
    APP_NAME: str = "Real Estate ERP API"
    API_V1_PREFIX: str = "/api/v1"
    DATABASE_URL: str = "postgresql+psycopg://postgres:postgres@localhost:5432/real_estate_erp"

    JWT_SECRET_KEY: str = ""
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    AUTH_RATE_LIMIT_MAX_ATTEMPTS: int = 10
    AUTH_RATE_LIMIT_WINDOW_SECONDS: int = 60

    REFRESH_COOKIE_SECURE: bool = False
    REFRESH_COOKIE_SAMESITE: str = "lax"

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            v = v.strip()
            if v.startswith("["):
                import json
                return json.loads(v)
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    def resolve_jwt_secret(self) -> str:
        if self.JWT_SECRET_KEY and self.JWT_SECRET_KEY != "CHANGE_ME_GENERATE_SECURE_RANDOM_SECRET":
            return self.JWT_SECRET_KEY
        if self.ENVIRONMENT == "production":
            raise RuntimeError("JWT_SECRET_KEY must be explicitly configured in production.")
        # Ephemeral in-memory fallback for local development / testing only
        if not hasattr(self, "_ephemeral_secret"):
            object.__setattr__(self, "_ephemeral_secret", secrets.token_urlsafe(48))
        return getattr(self, "_ephemeral_secret")


@lru_cache()
def get_settings() -> Settings:
    return Settings()
