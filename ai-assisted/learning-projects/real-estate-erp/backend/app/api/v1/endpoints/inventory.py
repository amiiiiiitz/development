from decimal import Decimal
from typing import Optional
import uuid
from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_client_ip, require_permission
from app.models.auth import Employee
from app.schemas.common import PaginatedResponse
from app.schemas.project_inventory import (
    InventoryCreate,
    InventoryRead,
    InventoryStatusChange,
    InventoryUpdate,
)
from app.services import inventory_service

router = APIRouter(prefix="/inventory", tags=["Inventory"])


@router.get("", response_model=PaginatedResponse[InventoryRead])
def list_inventory(
    project_id: Optional[uuid.UUID] = Query(None),
    unit_type: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    min_price: Optional[Decimal] = Query(None, ge=0),
    max_price: Optional[Decimal] = Query(None, ge=0),
    min_size: Optional[Decimal] = Query(None, ge=0),
    max_size: Optional[Decimal] = Query(None, ge=0),
    search: Optional[str] = Query(None),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    _actor: Employee = Depends(require_permission("inventory:read")),
    db: Session = Depends(get_db),
):
    return inventory_service.list_inventory(
        db,
        project_id=project_id,
        unit_type=unit_type,
        status=status_filter,
        min_price=min_price,
        max_price=max_price,
        min_size=min_size,
        max_size=max_size,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size,
    )


@router.get("/{unit_id}", response_model=InventoryRead)
def get_inventory_unit(
    unit_id: uuid.UUID,
    _actor: Employee = Depends(require_permission("inventory:read")),
    db: Session = Depends(get_db),
):
    return inventory_service.get_inventory_unit(db, unit_id)


@router.post("", response_model=InventoryRead, status_code=status.HTTP_201_CREATED)
def create_inventory_unit(
    payload: InventoryCreate,
    request: Request,
    actor: Employee = Depends(require_permission("inventory:write")),
    db: Session = Depends(get_db),
):
    return inventory_service.create_inventory_unit(db, payload, actor, ip_address=get_client_ip(request))


@router.patch("/{unit_id}", response_model=InventoryRead)
def update_inventory_unit(
    unit_id: uuid.UUID,
    payload: InventoryUpdate,
    request: Request,
    actor: Employee = Depends(require_permission("inventory:write")),
    db: Session = Depends(get_db),
):
    return inventory_service.update_inventory_unit(db, unit_id, payload, actor, ip_address=get_client_ip(request))


@router.post("/{unit_id}/status", response_model=InventoryRead)
def change_inventory_status(
    unit_id: uuid.UUID,
    payload: InventoryStatusChange,
    request: Request,
    actor: Employee = Depends(require_permission("inventory:write")),
    db: Session = Depends(get_db),
):
    return inventory_service.change_inventory_status(db, unit_id, payload, actor, ip_address=get_client_ip(request))
