from typing import List, Optional
import uuid
from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_client_ip, require_permission
from app.models.auth import Employee
from app.schemas.auth import EmployeeCreate, EmployeeRead, EmployeeUpdate, RoleRead
from app.schemas.common import PaginatedResponse
from app.services import auth_service

router = APIRouter(prefix="/employees", tags=["Employees & RBAC"])


@router.get("/roles", response_model=List[RoleRead])
def list_roles(
    _actor: Employee = Depends(require_permission("employees:read")),
    db: Session = Depends(get_db),
):
    return auth_service.list_roles(db)


@router.get("", response_model=PaginatedResponse[EmployeeRead])
def list_employees(
    search: Optional[str] = Query(None),
    role_name: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    _actor: Employee = Depends(require_permission("employees:read")),
    db: Session = Depends(get_db),
):
    return auth_service.list_employees(db, search=search, role_name=role_name, is_active=is_active, page=page, page_size=page_size)


@router.post("", response_model=EmployeeRead, status_code=status.HTTP_201_CREATED)
def create_employee(
    payload: EmployeeCreate,
    request: Request,
    actor: Employee = Depends(require_permission("employees:manage")),
    db: Session = Depends(get_db),
):
    return auth_service.create_employee(db, payload, actor, ip_address=get_client_ip(request))


@router.patch("/{employee_id}", response_model=EmployeeRead)
def update_employee(
    employee_id: uuid.UUID,
    payload: EmployeeUpdate,
    request: Request,
    actor: Employee = Depends(require_permission("employees:manage")),
    db: Session = Depends(get_db),
):
    return auth_service.update_employee(db, employee_id, payload, actor, ip_address=get_client_ip(request))
