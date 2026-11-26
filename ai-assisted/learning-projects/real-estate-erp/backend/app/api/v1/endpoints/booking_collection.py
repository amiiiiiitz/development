from datetime import date
from typing import Optional
import uuid
from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_client_ip, require_permission
from app.models.auth import Employee
from app.schemas.booking_collection import (
    BookingCancelRequest,
    BookingCreate,
    BookingRead,
    CollectionCreate,
    CollectionRead,
    CollectionReversalRequest,
    CollectionSummary,
)
from app.schemas.common import PaginatedResponse
from app.services import booking_service, collection_service

bookings_router = APIRouter(prefix="/bookings", tags=["Bookings"])
collections_router = APIRouter(prefix="/collections", tags=["Collections"])


@bookings_router.get("", response_model=PaginatedResponse[BookingRead])
def list_bookings(
    search: Optional[str] = Query(None),
    project_id: Optional[uuid.UUID] = Query(None),
    customer_id: Optional[uuid.UUID] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    actor: Employee = Depends(require_permission("bookings:read")),
    db: Session = Depends(get_db),
):
    return booking_service.list_bookings(
        db,
        actor,
        search=search,
        project_id=project_id,
        customer_id=customer_id,
        status=status_filter,
        start_date=start_date,
        end_date=end_date,
        page=page,
        page_size=page_size,
    )


@bookings_router.get("/{booking_id}", response_model=BookingRead)
def get_booking(
    booking_id: uuid.UUID,
    actor: Employee = Depends(require_permission("bookings:read")),
    db: Session = Depends(get_db),
):
    return booking_service.get_booking(db, booking_id, actor)


@bookings_router.post("", response_model=BookingRead, status_code=status.HTTP_201_CREATED)
def create_booking(
    payload: BookingCreate,
    request: Request,
    actor: Employee = Depends(require_permission("bookings:write")),
    db: Session = Depends(get_db),
):
    return booking_service.create_booking(db, payload, actor, ip_address=get_client_ip(request))


@bookings_router.post("/{booking_id}/confirm", response_model=BookingRead)
def confirm_booking(
    booking_id: uuid.UUID,
    request: Request,
    actor: Employee = Depends(require_permission("bookings:write")),
    db: Session = Depends(get_db),
):
    return booking_service.confirm_booking(db, booking_id, actor, ip_address=get_client_ip(request))


@bookings_router.post("/{booking_id}/complete-sale", response_model=BookingRead)
def complete_booking_sale(
    booking_id: uuid.UUID,
    request: Request,
    actor: Employee = Depends(require_permission("bookings:write")),
    db: Session = Depends(get_db),
):
    return booking_service.complete_booking_sale(db, booking_id, actor, ip_address=get_client_ip(request))


@bookings_router.post("/{booking_id}/cancel", response_model=BookingRead)
def cancel_booking(
    booking_id: uuid.UUID,
    payload: BookingCancelRequest,
    request: Request,
    actor: Employee = Depends(require_permission("bookings:cancel")),
    db: Session = Depends(get_db),
):
    return booking_service.cancel_booking(db, booking_id, payload.reason, actor, ip_address=get_client_ip(request))


@collections_router.get("/summary", response_model=CollectionSummary)
def get_collection_summary(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    project_id: Optional[uuid.UUID] = Query(None),
    _actor: Employee = Depends(require_permission("collections:read")),
    db: Session = Depends(get_db),
):
    return collection_service.get_collection_summary(db, start_date=start_date, end_date=end_date, project_id=project_id)


@collections_router.get("", response_model=PaginatedResponse[CollectionRead])
def list_collections(
    search: Optional[str] = Query(None),
    customer_id: Optional[uuid.UUID] = Query(None),
    booking_id: Optional[uuid.UUID] = Query(None),
    payment_method: Optional[str] = Query(None),
    payment_type: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    _actor: Employee = Depends(require_permission("collections:read")),
    db: Session = Depends(get_db),
):
    return collection_service.list_collections(
        db,
        search=search,
        customer_id=customer_id,
        booking_id=booking_id,
        payment_method=payment_method,
        payment_type=payment_type,
        start_date=start_date,
        end_date=end_date,
        page=page,
        page_size=page_size,
    )


@collections_router.get("/{collection_id}", response_model=CollectionRead)
def get_collection(
    collection_id: uuid.UUID,
    _actor: Employee = Depends(require_permission("collections:read")),
    db: Session = Depends(get_db),
):
    return collection_service.get_collection(db, collection_id)


@collections_router.post("", response_model=CollectionRead, status_code=status.HTTP_201_CREATED)
def record_collection(
    payload: CollectionCreate,
    request: Request,
    actor: Employee = Depends(require_permission("collections:write")),
    db: Session = Depends(get_db),
):
    return collection_service.record_collection(db, payload, actor, ip_address=get_client_ip(request))


@collections_router.post("/{collection_id}/reverse", response_model=CollectionRead)
def reverse_collection(
    collection_id: uuid.UUID,
    payload: CollectionReversalRequest,
    request: Request,
    actor: Employee = Depends(require_permission("collections:reverse")),
    db: Session = Depends(get_db),
):
    return collection_service.reverse_collection(db, collection_id, payload.reason, actor, ip_address=get_client_ip(request))
