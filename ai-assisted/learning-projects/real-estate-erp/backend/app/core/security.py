from collections import defaultdict
from datetime import datetime, timedelta, timezone
import hashlib
import secrets
import time
from typing import Any, Dict, Optional
import uuid

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, VerificationError, InvalidHashError
import jwt

from app.core.config import get_settings
from app.core.exceptions import UnauthorizedError

password_hasher = PasswordHasher(
    time_cost=3,
    memory_cost=65536,
    parallelism=4,
)


def hash_password(plain_password: str) -> str:
    return password_hasher.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return password_hasher.verify(hashed_password, plain_password)
    except (VerifyMismatchError, VerificationError, InvalidHashError):
        return False


def hash_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def create_access_token(
    subject: str,
    role: str,
    extra_claims: Optional[Dict[str, Any]] = None,
) -> str:
    settings = get_settings()
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload: Dict[str, Any] = {
        "sub": str(subject),
        "role": role,
        "type": "access",
        "jti": str(uuid.uuid4()),
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
    }
    if extra_claims:
        payload.update(extra_claims)
    return jwt.encode(payload, settings.resolve_jwt_secret(), algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(subject: str) -> tuple[str, str, datetime]:
    settings = get_settings()
    now = datetime.now(timezone.utc)
    expire = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    jti = str(uuid.uuid4())
    payload = {
        "sub": str(subject),
        "type": "refresh",
        "jti": jti,
        "nonce": secrets.token_urlsafe(16),
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
    }
    token = jwt.encode(payload, settings.resolve_jwt_secret(), algorithm=settings.JWT_ALGORITHM)
    return token, jti, expire


def decode_token(token: str, expected_type: str = "access") -> Dict[str, Any]:
    settings = get_settings()
    try:
        payload = jwt.decode(
            token,
            settings.resolve_jwt_secret(),
            algorithms=[settings.JWT_ALGORITHM],
        )
    except jwt.ExpiredSignatureError:
        raise UnauthorizedError("Token has expired.")
    except jwt.InvalidTokenError:
        raise UnauthorizedError("Invalid authentication token.")

    if payload.get("type") != expected_type:
        raise UnauthorizedError("Invalid token type.")
    return payload


class SlidingWindowRateLimiter:
    def __init__(self) -> None:
        self._attempts: Dict[str, list[float]] = defaultdict(list)

    def check(self, key: str, max_attempts: int, window_seconds: int) -> bool:
        now = time.monotonic()
        cutoff = now - window_seconds
        recent = [ts for ts in self._attempts[key] if ts > cutoff]
        if len(recent) >= max_attempts:
            self._attempts[key] = recent
            return False
        recent.append(now)
        self._attempts[key] = recent
        return True

    def reset(self, key: str) -> None:
        self._attempts.pop(key, None)


auth_rate_limiter = SlidingWindowRateLimiter()
