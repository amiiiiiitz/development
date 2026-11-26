from typing import Optional
import uuid
from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_client_ip, require_permission
from app.models.auth import Employee
from app.schemas.common import PaginatedResponse
from app.schemas.crm import (
    CustomerCreate,
    CustomerRead,
    CustomerUpdate,
    LeadConvertRequest,
    LeadCreate,
    LeadRead,
    LeadUpdate,
)
from app.services import crm_service

customers_router = APIRouter(prefix="/customers", tags=["Customers"])
leads_router = APIRouter(prefix="/leads", tags=["Leads"])


@customers_router.get("", response_model=PaginatedResponse[CustomerRead])
def list_customers(
    search: Optional[str] = Query(None),
    assigned_sales_executive_id: Optional[uuid.UUID] = Query(None),
    include_archived: bool = Query(False),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    actor: Employee = Depends(require_permission("customers:read")),
    db: Session = Depends(get_db),
):
    return crm_service.list_customers(
        db,
        actor,
        search=search,
        assigned_sales_executive_id=assigned_sales_executive_id,
        include_archived=include_archived,
        page=page,
        page_size=page_size,
    )


@customers_router.get("/{customer_id}", response_model=CustomerRead)
def get_customer(
    customer_id: uuid.UUID,
    actor: Employee = Depends(require_permission("customers:read")),
    db: Session = Depends(get_db),
):
    return crm_service.get_customer(db, customer_id, actor)


@customers_router.get("/{customer_id}/profile")
def get_customer_profile(
    customer_id: uuid.UUID,
    actor: Employee = Depends(require_permission("customers:read")),
    db: Session = Depends(get_db),
):
    return crm_service.get_customer_profile(db, customer_id, actor)


@customers_router.post("", response_model=CustomerRead, status_code=status.HTTP_201_CREATED)
def create_customer(
    payload: CustomerCreate,
    request: Request,
    actor: Employee = Depends(require_permission("customers:write")),
    db: Session = Depends(get_db),
):
    return crm_service.create_customer(db, payload, actor, ip_address=get_client_ip(request))


@customers_router.patch("/{customer_id}", response_model=CustomerRead)
def update_customer(
    customer_id: uuid.UUID,
    payload: CustomerUpdate,
    request: Request,
    actor: Employee = Depends(require_permission("customers:write")),
    db: Session = Depends(get_db),
):
    return crm_service.update_customer(db, customer_id, payload, actor, ip_address=get_client_ip(request))


@leads_router.get("", response_model=PaginatedResponse[LeadRead])
def list_leads(
    search: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    assigned_employee_id: Optional[uuid.UUID] = Query(None),
    interested_project_id: Optional[uuid.UUID] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    actor: Employee = Depends(require_permission("leads:read")),
    db: Session = Depends(get_db),
):
    return crm_service.list_leads(
        db,
        actor,
        search=search,
        status=status_filter,
        assigned_employee_id=assigned_employee_id,
        interested_project_id=interested_project_id,
        page=page,
        page_size=page_size,
    )


@leads_router.get("/{lead_id}", response_model=LeadRead)
def get_lead(
    lead_id: uuid.UUID,
    actor: Employee = Depends(require_permission("leads:read")),
    db: Session = Depends(get_db),
):
    return crm_service.get_lead(db, lead_id, actor)


@leads_router.post("", response_model=LeadRead, status_code=status.HTTP_201_CREATED)
def create_lead(
    payload: LeadCreate,
    request: Request,
    actor: Employee = Depends(require_permission("leads:write")),
    db: Session = Depends(get_db),
):
    return crm_service.create_lead(db, payload, actor, ip_address=get_client_ip(request))


@leads_router.patch("/{lead_id}", response_model=LeadRead)
def update_lead(
    lead_id: uuid.UUID,
    payload: LeadUpdate,
    request: Request,
    actor: Employee = Depends(require_permission("leads:write")),
    db: Session = Depends(get_db),
):
    return crm_service.update_lead(db, lead_id, payload, actor, ip_address=get_client_ip(request))


@leads_router.post("/{lead_id}/convert", response_model=CustomerRead)
def convert_lead(
    lead_id: uuid.UUID,
    payload: LeadConvertRequest,
    request: Request,
    actor: Employee = Depends(require_permission("leads:write")),
    db: Session = Depends(get_db),
):
    return crm_service.convert_lead_to_customer(db, lead_id, payload, actor, ip_address=get_client_ip(request))
