from datetime import datetime
from typing import List, Optional
import uuid
from pydantic import BaseModel, EmailStr, Field

from app.schemas.common import ORMBase


class SetupStatusResponse(BaseModel):
    needs_setup: bool


class InitialAdminSetupRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=150)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=30)
    password: str = Field(..., min_length=10, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1, max_length=128)


class RefreshTokenRequest(BaseModel):
    refresh_token: Optional[str] = None


class LogoutRequest(BaseModel):
    refresh_token: Optional[str] = None


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., min_length=1, max_length=128)
    new_password: str = Field(..., min_length=10, max_length=128)


class RoleRead(ORMBase):
    id: uuid.UUID
    name: str
    description: Optional[str] = None
    permissions: List[str] = []


class EmployeeCreate(BaseModel):
    employee_code: Optional[str] = Field(None, max_length=30)
    full_name: str = Field(..., min_length=2, max_length=150)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=30)
    password: str = Field(..., min_length=10, max_length=128)
    role_name: str = Field(..., max_length=50)
    is_active: bool = True


class EmployeeUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=150)
    phone: Optional[str] = Field(None, max_length=30)
    role_name: Optional[str] = Field(None, max_length=50)
    is_active: Optional[bool] = None


class EmployeeRead(ORMBase):
    id: uuid.UUID
    employee_code: str
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    role_name: str
    permissions: List[str] = []
    is_active: bool
    is_superuser: bool
    last_login_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    employee: EmployeeRead
