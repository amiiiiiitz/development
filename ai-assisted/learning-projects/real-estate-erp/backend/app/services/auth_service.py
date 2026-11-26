from datetime import datetime, timezone
import math
from typing import Optional
import uuid
from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload

from app.core.config import get_settings
from app.core.exceptions import (
    BusinessRuleError,
    ConflictError,
    ForbiddenError,
    NotFoundError,
    UnauthorizedError,
)
from app.core.permissions import (
    PERMISSIONS,
    ROLE_DESCRIPTIONS,
    ROLE_PERMISSION_MAP,
    RoleName,
)
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    hash_token,
    verify_password,
)
from app.dependencies.auth import get_employee_permissions
from app.models.auth import Employee, Permission, RefreshToken, Role, RolePermission
from app.schemas.auth import (
    EmployeeCreate,
    EmployeeRead,
    EmployeeUpdate,
    InitialAdminSetupRequest,
    RoleRead,
    TokenResponse,
)
from app.services.audit_service import record_activity
from app.utils.helpers import calculate_pagination


def ensure_roles_and_permissions(db: Session) -> None:
    existing_perms = {p.code: p for p in db.query(Permission).all()}
    for code, module, desc in PERMISSIONS:
        if code not in existing_perms:
            perm = Permission(code=code, module=module, description=desc)
            db.add(perm)
            db.flush()
            existing_perms[code] = perm

    existing_roles = {r.name: r for r in db.query(Role).all()}
    for role_name, perm_codes in ROLE_PERMISSION_MAP.items():
        role = existing_roles.get(role_name)
        if not role:
            role = Role(
                name=role_name,
                description=ROLE_DESCRIPTIONS.get(role_name, ""),
            )
            db.add(role)
            db.flush()
            existing_roles[role_name] = role

        current_rp = {
            rp.permission_id
            for rp in db.query(RolePermission).filter(RolePermission.role_id == role.id).all()
        }
        for code in perm_codes:
            perm = existing_perms[code]
            if perm.id not in current_rp:
                db.add(RolePermission(role_id=role.id, permission_id=perm.id))

    db.commit()


def to_employee_read(emp: Employee) -> EmployeeRead:
    return EmployeeRead(
        id=emp.id,
        employee_code=emp.employee_code,
        full_name=emp.full_name,
        email=emp.email,
        phone=emp.phone,
        role_name=emp.role.name if emp.role else "",
        permissions=get_employee_permissions(emp),
        is_active=emp.is_active,
        is_superuser=emp.is_superuser,
        last_login_at=emp.last_login_at,
        created_at=emp.created_at,
        updated_at=emp.updated_at,
    )


def needs_initial_setup(db: Session) -> bool:
    return db.query(func.count(Employee.id)).scalar() == 0


def setup_initial_admin(
    db: Session,
    payload: InitialAdminSetupRequest,
    ip_address: Optional[str] = None,
) -> TokenResponse:
    ensure_roles_and_permissions(db)
    if db.query(func.count(Employee.id)).scalar() > 0:
        raise ConflictError("Initial administrator setup has already been completed.")

    admin_role = db.query(Role).filter(Role.name == RoleName.ADMIN.value).first()
    if not admin_role:
        raise BusinessRuleError("ADMIN role is not initialized.")

    employee = Employee(
        employee_code="EMP-0001",
        full_name=payload.full_name.strip(),
        email=payload.email.lower().strip(),
        phone=payload.phone,
        password_hash=hash_password(payload.password),
        role_id=admin_role.id,
        is_active=True,
        is_superuser=True,
        last_login_at=datetime.now(timezone.utc),
    )
    db.add(employee)
    db.flush()

    record_activity(
        db,
        employee_id=employee.id,
        action="SYSTEM_INITIAL_ADMIN_CREATED",
        entity_type="employee",
        entity_id=employee.id,
        metadata={"email": employee.email, "role": RoleName.ADMIN.value},
        ip_address=ip_address,
    )
    token_res = _issue_tokens_for_employee(db, employee)
    db.commit()
    return token_res


def _issue_tokens_for_employee(db: Session, employee: Employee) -> TokenResponse:
    settings = get_settings()
    emp_loaded = (
        db.query(Employee)
        .options(
            joinedload(Employee.role)
            .joinedload(Role.role_permissions)
            .joinedload(RolePermission.permission)
        )
        .filter(Employee.id == employee.id)
        .first()
    )
    role_name = emp_loaded.role.name if emp_loaded.role else ""
    access_token = create_access_token(subject=str(emp_loaded.id), role=role_name)
    raw_refresh, jti, expires_at = create_refresh_token(subject=str(emp_loaded.id))

    db.add(
        RefreshToken(
            employee_id=emp_loaded.id,
            token_hash=hash_token(raw_refresh),
            jti=jti,
            expires_at=expires_at,
        )
    )
    db.flush()
    return TokenResponse(
        access_token=access_token,
        refresh_token=raw_refresh,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        employee=to_employee_read(emp_loaded),
    )


def login_employee(
    db: Session,
    email: str,
    password: str,
    ip_address: Optional[str] = None,
) -> TokenResponse:
    normalized_email = email.lower().strip()
    employee = (
        db.query(Employee)
        .options(
            joinedload(Employee.role)
            .joinedload(Role.role_permissions)
            .joinedload(RolePermission.permission)
        )
        .filter(Employee.email == normalized_email)
        .first()
    )
    if not employee or not verify_password(password, employee.password_hash):
        raise UnauthorizedError("Invalid email or password.")
    if not employee.is_active:
        raise ForbiddenError("Your employee account has been deactivated. Contact an administrator.")

    employee.last_login_at = datetime.now(timezone.utc)
    record_activity(
        db,
        employee_id=employee.id,
        action="EMPLOYEE_LOGIN",
        entity_type="employee",
        entity_id=employee.id,
        ip_address=ip_address,
    )
    token_res = _issue_tokens_for_employee(db, employee)
    db.commit()
    return token_res


def refresh_employee_session(db: Session, raw_refresh_token: str) -> TokenResponse:
    payload = decode_token(raw_refresh_token, expected_type="refresh")
    jti = payload.get("jti")
    sub = payload.get("sub")
    if not jti or not sub:
        raise UnauthorizedError("Invalid refresh token payload.")

    token_digest = hash_token(raw_refresh_token)
    stored = db.query(RefreshToken).filter(RefreshToken.token_hash == token_digest).first()
    if not stored:
        raise UnauthorizedError("Refresh token not recognized.")

    now = datetime.now(timezone.utc)
    if stored.revoked_at is not None:
        # Refresh token reuse detected — revoke all active tokens for this employee
        db.query(RefreshToken).filter(
            RefreshToken.employee_id == stored.employee_id,
            RefreshToken.revoked_at.is_(None),
        ).update({"revoked_at": now})
        db.commit()
        raise UnauthorizedError("Refresh token was already used or revoked. Please sign in again.")

    expires_at = stored.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < now:
        raise UnauthorizedError("Refresh token has expired.")

    employee = db.query(Employee).filter(Employee.id == stored.employee_id).first()
    if not employee or not employee.is_active:
        raise UnauthorizedError("Employee account is inactive or unavailable.")

    new_tokens = _issue_tokens_for_employee(db, employee)
    new_payload = decode_token(new_tokens.refresh_token, expected_type="refresh")
    stored.revoked_at = now
    stored.replaced_by_jti = new_payload.get("jti")
    db.commit()
    return new_tokens


def logout_employee(db: Session, raw_refresh_token: Optional[str], employee: Optional[Employee], ip_address: Optional[str] = None) -> None:
    now = datetime.now(timezone.utc)
    if raw_refresh_token:
        digest = hash_token(raw_refresh_token)
        stored = db.query(RefreshToken).filter(RefreshToken.token_hash == digest).first()
        if stored and stored.revoked_at is None:
            stored.revoked_at = now
    if employee:
        record_activity(
            db,
            employee_id=employee.id,
            action="EMPLOYEE_LOGOUT",
            entity_type="employee",
            entity_id=employee.id,
            ip_address=ip_address,
        )
    db.commit()


def change_employee_password(
    db: Session,
    employee: Employee,
    current_password: str,
    new_password: str,
    ip_address: Optional[str] = None,
) -> None:
    if not verify_password(current_password, employee.password_hash):
        raise UnauthorizedError("Current password is incorrect.")
    if current_password == new_password:
        raise BusinessRuleError("New password must be different from your current password.")

    employee.password_hash = hash_password(new_password)
    now = datetime.now(timezone.utc)
    db.query(RefreshToken).filter(
        RefreshToken.employee_id == employee.id,
        RefreshToken.revoked_at.is_(None),
    ).update({"revoked_at": now})

    record_activity(
        db,
        employee_id=employee.id,
        action="EMPLOYEE_PASSWORD_CHANGED",
        entity_type="employee",
        entity_id=employee.id,
        ip_address=ip_address,
    )
    db.commit()


def list_roles(db: Session) -> list[RoleRead]:
    ensure_roles_and_permissions(db)
    roles = (
        db.query(Role)
        .options(joinedload(Role.role_permissions).joinedload(RolePermission.permission))
        .order_by(Role.name.asc())
        .all()
    )
    return [
        RoleRead(
            id=r.id,
            name=r.name,
            description=r.description,
            permissions=sorted(
                rp.permission.code for rp in r.role_permissions if rp.permission
            ),
        )
        for r in roles
    ]


def list_employees(
    db: Session,
    search: Optional[str] = None,
    role_name: Optional[str] = None,
    is_active: Optional[bool] = None,
    page: int = 1,
    page_size: int = 20,
):
    query = db.query(Employee).options(
        joinedload(Employee.role)
        .joinedload(Role.role_permissions)
        .joinedload(RolePermission.permission)
    )
    if search:
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Employee.full_name.ilike(term),
                Employee.email.ilike(term),
                Employee.employee_code.ilike(term),
            )
        )
    if role_name:
        query = query.join(Employee.role).filter(Role.name == role_name)
    if is_active is not None:
        query = query.filter(Employee.is_active == is_active)

    total = query.count()
    safe_page, total_pages = calculate_pagination(total, page, page_size)
    rows = (
        query.order_by(Employee.created_at.desc())
        .offset((safe_page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return {
        "items": [to_employee_read(e) for e in rows],
        "total": total,
        "page": safe_page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


def _next_employee_code(db: Session) -> str:
    count = db.query(func.count(Employee.id)).scalar() or 0
    return f"EMP-{count + 1:04d}"


def create_employee(
    db: Session,
    payload: EmployeeCreate,
    actor: Employee,
    ip_address: Optional[str] = None,
) -> EmployeeRead:
    ensure_roles_and_permissions(db)
    normalized_email = payload.email.lower().strip()
    if db.query(Employee).filter(Employee.email == normalized_email).first():
        raise ConflictError("An employee with this email already exists.")

    role = db.query(Role).filter(Role.name == payload.role_name).first()
    if not role:
        raise BusinessRuleError(f"Unknown role '{payload.role_name}'.")

    if role.name == RoleName.ADMIN.value and not actor.is_superuser and actor.role.name != RoleName.ADMIN.value:
        raise ForbiddenError("Only administrators can create ADMIN accounts.")

    emp_code = (payload.employee_code or _next_employee_code(db)).strip().upper()
    if db.query(Employee).filter(Employee.employee_code == emp_code).first():
        emp_code = f"EMP-{uuid.uuid4().hex[:6].upper()}"

    emp = Employee(
        employee_code=emp_code,
        full_name=payload.full_name.strip(),
        email=normalized_email,
        phone=payload.phone,
        password_hash=hash_password(payload.password),
        role_id=role.id,
        is_active=payload.is_active,
        is_superuser=(role.name == RoleName.ADMIN.value),
    )
    db.add(emp)
    db.flush()

    record_activity(
        db,
        employee_id=actor.id,
        action="EMPLOYEE_CREATED",
        entity_type="employee",
        entity_id=emp.id,
        metadata={"employee_code": emp.employee_code, "role": role.name},
        ip_address=ip_address,
    )
    db.commit()

    loaded = (
        db.query(Employee)
        .options(
            joinedload(Employee.role)
            .joinedload(Role.role_permissions)
            .joinedload(RolePermission.permission)
        )
        .filter(Employee.id == emp.id)
        .first()
    )
    return to_employee_read(loaded)


def update_employee(
    db: Session,
    employee_id: uuid.UUID,
    payload: EmployeeUpdate,
    actor: Employee,
    ip_address: Optional[str] = None,
) -> EmployeeRead:
    emp = (
        db.query(Employee)
        .options(
            joinedload(Employee.role)
            .joinedload(Role.role_permissions)
            .joinedload(RolePermission.permission)
        )
        .filter(Employee.id == employee_id)
        .first()
    )
    if not emp:
        raise NotFoundError("Employee not found.")

    if emp.role and emp.role.name == RoleName.ADMIN.value and actor.role.name != RoleName.ADMIN.value:
        raise ForbiddenError("Cannot modify an administrator account.")

    if payload.full_name is not None:
        emp.full_name = payload.full_name.strip()
    if payload.phone is not None:
        emp.phone = payload.phone

    if payload.role_name is not None and payload.role_name != emp.role.name:
        if actor.role.name != RoleName.ADMIN.value:
            raise ForbiddenError("Only administrators can reassign roles.")
        new_role = db.query(Role).filter(Role.name == payload.role_name).first()
        if not new_role:
            raise BusinessRuleError(f"Unknown role '{payload.role_name}'.")
        if emp.id == actor.id and new_role.name != RoleName.ADMIN.value:
            raise BusinessRuleError("You cannot demote your own administrator role.")
        emp.role_id = new_role.id
        emp.is_superuser = new_role.name == RoleName.ADMIN.value

    if payload.is_active is not None and payload.is_active != emp.is_active:
        if emp.id == actor.id and not payload.is_active:
            raise BusinessRuleError("You cannot deactivate your own account.")
        emp.is_active = payload.is_active
        if not emp.is_active:
            now = datetime.now(timezone.utc)
            db.query(RefreshToken).filter(
                RefreshToken.employee_id == emp.id,
                RefreshToken.revoked_at.is_(None),
            ).update({"revoked_at": now})

    record_activity(
        db,
        employee_id=actor.id,
        action="EMPLOYEE_UPDATED" if payload.is_active is None else (
            "EMPLOYEE_ACTIVATED" if emp.is_active else "EMPLOYEE_DEACTIVATED"
        ),
        entity_type="employee",
        entity_id=emp.id,
        metadata={"is_active": emp.is_active},
        ip_address=ip_address,
    )
    db.commit()

    db.refresh(emp)
    loaded = (
        db.query(Employee)
        .options(
            joinedload(Employee.role)
            .joinedload(Role.role_permissions)
            .joinedload(RolePermission.permission)
        )
        .filter(Employee.id == emp.id)
        .first()
    )
    return to_employee_read(loaded)
