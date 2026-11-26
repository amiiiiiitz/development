from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import get_db
from app.core.exceptions import RateLimitError, UnauthorizedError
from app.core.security import auth_rate_limiter
from app.dependencies.auth import get_client_ip, get_current_employee
from app.models.auth import Employee
from app.schemas.auth import (
    ChangePasswordRequest,
    EmployeeRead,
    InitialAdminSetupRequest,
    LoginRequest,
    LogoutRequest,
    RefreshTokenRequest,
    SetupStatusResponse,
    TokenResponse,
)
from app.schemas.common import MessageResponse
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _set_refresh_cookie(response: Response, refresh_token: str) -> None:
    settings = get_settings()
    response.set_cookie(
        key="erp_refresh_token",
        value=refresh_token,
        httponly=True,
        secure=settings.REFRESH_COOKIE_SECURE,
        samesite=settings.REFRESH_COOKIE_SAMESITE,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        path="/api/v1/auth",
    )


@router.get("/setup-status", response_model=SetupStatusResponse)
def get_setup_status(db: Session = Depends(get_db)):
    return SetupStatusResponse(needs_setup=auth_service.needs_initial_setup(db))


@router.post("/setup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def setup_initial_admin(
    payload: InitialAdminSetupRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    settings = get_settings()
    ip = get_client_ip(request)
    if not auth_rate_limiter.check(f"setup:{ip}", settings.AUTH_RATE_LIMIT_MAX_ATTEMPTS, settings.AUTH_RATE_LIMIT_WINDOW_SECONDS):
        raise RateLimitError()
    res = auth_service.setup_initial_admin(db, payload, ip_address=ip)
    _set_refresh_cookie(response, res.refresh_token)
    return res


@router.post("/login", response_model=TokenResponse)
def login(
    payload: LoginRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    settings = get_settings()
    ip = get_client_ip(request)
    rate_key = f"login:{ip}:{payload.email.lower().strip()}"
    if not auth_rate_limiter.check(rate_key, settings.AUTH_RATE_LIMIT_MAX_ATTEMPTS, settings.AUTH_RATE_LIMIT_WINDOW_SECONDS):
        raise RateLimitError("Too many login attempts. Please wait before trying again.")
    res = auth_service.login_employee(db, payload.email, payload.password, ip_address=ip)
    auth_rate_limiter.reset(rate_key)
    _set_refresh_cookie(response, res.refresh_token)
    return res


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(
    request: Request,
    response: Response,
    payload: RefreshTokenRequest = RefreshTokenRequest(),
    db: Session = Depends(get_db),
):
    raw_token = payload.refresh_token or request.cookies.get("erp_refresh_token")
    if not raw_token:
        raise UnauthorizedError("Refresh token is required.")
    res = auth_service.refresh_employee_session(db, raw_token)
    _set_refresh_cookie(response, res.refresh_token)
    return res


@router.post("/logout", response_model=MessageResponse)
def logout(
    request: Request,
    response: Response,
    payload: LogoutRequest = LogoutRequest(),
    current_employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    raw_token = payload.refresh_token or request.cookies.get("erp_refresh_token")
    auth_service.logout_employee(db, raw_token, current_employee, ip_address=get_client_ip(request))
    response.delete_cookie("erp_refresh_token", path="/api/v1/auth")
    return MessageResponse(message="Logged out successfully.")


@router.get("/me", response_model=EmployeeRead)
def get_me(current_employee: Employee = Depends(get_current_employee)):
    return auth_service.to_employee_read(current_employee)


@router.post("/change-password", response_model=MessageResponse)
def change_password(
    payload: ChangePasswordRequest,
    request: Request,
    current_employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    auth_service.change_employee_password(
        db,
        current_employee,
        payload.current_password,
        payload.new_password,
        ip_address=get_client_ip(request),
    )
    return MessageResponse(message="Password changed successfully. Please sign in again on other devices.")
