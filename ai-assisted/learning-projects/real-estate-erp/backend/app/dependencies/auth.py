from typing import Optional
import uuid
from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.exceptions import ForbiddenError, UnauthorizedError
from app.core.permissions import ROLE_PERMISSION_MAP
from app.core.security import decode_token
from app.models.auth import Employee, Role, RolePermission

bearer_scheme = HTTPBearer(auto_error=False)


def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def get_employee_permissions(employee: Employee) -> list[str]:
    if not employee.role:
        return []
    db_perms = [
        rp.permission.code
        for rp in (employee.role.role_permissions or [])
        if rp.permission
    ]
    if db_perms:
        return sorted(set(db_perms))
    return sorted(ROLE_PERMISSION_MAP.get(employee.role.name, []))


def get_current_employee(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> Employee:
    if not credentials or not credentials.credentials:
        raise UnauthorizedError("Missing authentication credentials.")

    payload = decode_token(credentials.credentials, expected_type="access")
    subject = payload.get("sub")
    if not subject:
        raise UnauthorizedError("Invalid token subject.")

    try:
        employee_id = uuid.UUID(subject)
    except ValueError:
        raise UnauthorizedError("Malformed employee identifier in token.")

    employee = (
        db.query(Employee)
        .options(
            joinedload(Employee.role)
            .joinedload(Role.role_permissions)
            .joinedload(RolePermission.permission)
        )
        .filter(Employee.id == employee_id)
        .first()
    )
    if not employee:
        raise UnauthorizedError("Employee account not found.")
    if not employee.is_active:
        raise UnauthorizedError("Employee account is deactivated.")

    return employee


def require_permission(permission_code: str):
    def dependency(current_employee: Employee = Depends(get_current_employee)) -> Employee:
        perms = get_employee_permissions(current_employee)
        if permission_code not in perms and not current_employee.is_superuser:
            raise ForbiddenError(
                f"Missing required permission: {permission_code}"
            )
        return current_employee

    return dependency


def require_any_permission(*permission_codes: str):
    def dependency(current_employee: Employee = Depends(get_current_employee)) -> Employee:
        if current_employee.is_superuser:
            return current_employee
        perms = set(get_employee_permissions(current_employee))
        if not any(code in perms for code in permission_codes):
            raise ForbiddenError("You do not have sufficient permissions for this resource.")
        return current_employee

    return dependency
