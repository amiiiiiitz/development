from decimal import Decimal
from typing import Optional
import uuid
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from app.core.exceptions import BusinessRuleError, ConflictError, NotFoundError
from app.models.auth import Employee
from app.models.booking_collection import Booking
from app.models.project_inventory import InventoryStatusHistory, InventoryUnit, Project
from app.schemas.project_inventory import (
    InventoryCreate,
    InventoryRead,
    InventoryStatusChange,
    InventoryStatusHistoryRead,
    InventoryUpdate,
)
from app.services.audit_service import record_activity
from app.utils.helpers import calculate_pagination


def _to_inventory_read(unit: InventoryUnit, include_history: bool = False) -> InventoryRead:
    history = []
    if include_history:
        history = [
            InventoryStatusHistoryRead(
                id=h.id,
                inventory_unit_id=h.inventory_unit_id,
                previous_status=h.previous_status,
                new_status=h.new_status,
                changed_by_id=h.changed_by_id,
                changed_by_name=h.changed_by.full_name if h.changed_by else None,
                booking_id=h.booking_id,
                reason=h.reason,
                created_at=h.created_at,
            )
            for h in (unit.status_history or [])
        ]
    return InventoryRead(
        id=unit.id,
        project_id=unit.project_id,
        project_name=unit.project.name if unit.project else None,
        project_code=unit.project.project_code if unit.project else None,
        unit_number=unit.unit_number,
        building_name=unit.building_name,
        floor_number=unit.floor_number,
        unit_type=unit.unit_type,
        bedrooms=unit.bedrooms,
        bathrooms=unit.bathrooms,
        size_sqft=unit.size_sqft,
        facing=unit.facing,
        base_price=unit.base_price,
        additional_charges=unit.additional_charges,
        discount=unit.discount,
        final_selling_price=unit.final_selling_price,
        description=unit.description,
        status=unit.status,
        created_at=unit.created_at,
        updated_at=unit.updated_at,
        status_history=history,
    )


def list_inventory(
    db: Session,
    project_id: Optional[uuid.UUID] = None,
    unit_type: Optional[str] = None,
    status: Optional[str] = None,
    min_price: Optional[Decimal] = None,
    max_price: Optional[Decimal] = None,
    min_size: Optional[Decimal] = None,
    max_size: Optional[Decimal] = None,
    search: Optional[str] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    page: int = 1,
    page_size: int = 20,
):
    query = db.query(InventoryUnit).options(joinedload(InventoryUnit.project))
    if project_id:
        query = query.filter(InventoryUnit.project_id == project_id)
    if unit_type:
        query = query.filter(InventoryUnit.unit_type == unit_type)
    if status:
        query = query.filter(InventoryUnit.status == status)
    if min_price is not None:
        query = query.filter(InventoryUnit.final_selling_price >= min_price)
    if max_price is not None:
        query = query.filter(InventoryUnit.final_selling_price <= max_price)
    if min_size is not None:
        query = query.filter(InventoryUnit.size_sqft >= min_size)
    if max_size is not None:
        query = query.filter(InventoryUnit.size_sqft <= max_size)
    if search:
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                InventoryUnit.unit_number.ilike(term),
                InventoryUnit.building_name.ilike(term),
            )
        )

    sort_col_map = {
        "unit_number": InventoryUnit.unit_number,
        "final_selling_price": InventoryUnit.final_selling_price,
        "size_sqft": InventoryUnit.size_sqft,
        "status": InventoryUnit.status,
        "created_at": InventoryUnit.created_at,
    }
    sort_col = sort_col_map.get(sort_by, InventoryUnit.created_at)
    order_expr = sort_col.asc() if sort_order == "asc" else sort_col.desc()

    total = query.count()
    safe_page, total_pages = calculate_pagination(total, page, page_size)
    rows = query.order_by(order_expr).offset((safe_page - 1) * page_size).limit(page_size).all()

    return {
        "items": [_to_inventory_read(u, include_history=False) for u in rows],
        "total": total,
        "page": safe_page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


def get_inventory_unit(db: Session, unit_id: uuid.UUID) -> InventoryRead:
    unit = (
        db.query(InventoryUnit)
        .options(
            joinedload(InventoryUnit.project),
            joinedload(InventoryUnit.status_history).joinedload(InventoryStatusHistory.changed_by),
        )
        .filter(InventoryUnit.id == unit_id)
        .first()
    )
    if not unit:
        raise NotFoundError("Inventory unit not found.")
    return _to_inventory_read(unit, include_history=True)


def create_inventory_unit(
    db: Session,
    payload: InventoryCreate,
    actor: Employee,
    ip_address: Optional[str] = None,
) -> InventoryRead:
    project = db.query(Project).filter(Project.id == payload.project_id).first()
    if not project or project.is_archived:
        raise NotFoundError("Target project was not found or is archived.")

    unit_number = payload.unit_number.strip().upper()
    existing = (
        db.query(InventoryUnit)
        .filter(
            InventoryUnit.project_id == payload.project_id,
            InventoryUnit.unit_number == unit_number,
        )
        .first()
    )
    if existing:
        raise ConflictError(f"Unit '{unit_number}' already exists in project '{project.project_code}'.")

    final_price = payload.base_price + payload.additional_charges - payload.discount
    if final_price < 0:
        raise BusinessRuleError("Final selling price cannot be negative.")

    unit = InventoryUnit(
        project_id=payload.project_id,
        unit_number=unit_number,
        building_name=payload.building_name.strip() if payload.building_name else None,
        floor_number=payload.floor_number,
        unit_type=payload.unit_type,
        bedrooms=payload.bedrooms,
        bathrooms=payload.bathrooms,
        size_sqft=payload.size_sqft,
        facing=payload.facing,
        base_price=payload.base_price,
        additional_charges=payload.additional_charges,
        discount=payload.discount,
        final_selling_price=final_price,
        description=payload.description,
        status="Available",
    )
    db.add(unit)
    db.flush()

    db.add(
        InventoryStatusHistory(
            inventory_unit_id=unit.id,
            previous_status=None,
            new_status="Available",
            changed_by_id=actor.id,
            reason="Initial inventory unit creation",
        )
    )
    record_activity(
        db,
        employee_id=actor.id,
        action="INVENTORY_CREATED",
        entity_type="inventory_unit",
        entity_id=unit.id,
        metadata={"project_id": str(project.id), "unit_number": unit.unit_number},
        ip_address=ip_address,
    )
    db.commit()
    return get_inventory_unit(db, unit.id)


def update_inventory_unit(
    db: Session,
    unit_id: uuid.UUID,
    payload: InventoryUpdate,
    actor: Employee,
    ip_address: Optional[str] = None,
) -> InventoryRead:
    unit = db.query(InventoryUnit).filter(InventoryUnit.id == unit_id).first()
    if not unit:
        raise NotFoundError("Inventory unit not found.")

    if unit.status in ("Sold", "Handover Complete"):
        raise BusinessRuleError("Cannot modify pricing or core details of a sold/handed-over unit.")

    data = payload.model_dump(exclude_unset=True)
    if "unit_number" in data and data["unit_number"]:
        new_num = data["unit_number"].strip().upper()
        dup = (
            db.query(InventoryUnit)
            .filter(
                InventoryUnit.project_id == unit.project_id,
                InventoryUnit.unit_number == new_num,
                InventoryUnit.id != unit.id,
            )
            .first()
        )
        if dup:
            raise ConflictError(f"Unit number '{new_num}' already exists in this project.")
        data["unit_number"] = new_num

    for k, v in data.items():
        setattr(unit, k, v)

    final_price = unit.base_price + unit.additional_charges - unit.discount
    if final_price < 0:
        raise BusinessRuleError("Final selling price cannot be negative.")
    unit.final_selling_price = final_price

    record_activity(
        db,
        employee_id=actor.id,
        action="INVENTORY_UPDATED",
        entity_type="inventory_unit",
        entity_id=unit.id,
        metadata={"updated_fields": list(data.keys())},
        ip_address=ip_address,
    )
    db.commit()
    return get_inventory_unit(db, unit.id)


def change_inventory_status(
    db: Session,
    unit_id: uuid.UUID,
    payload: InventoryStatusChange,
    actor: Employee,
    ip_address: Optional[str] = None,
) -> InventoryRead:
    unit = db.query(InventoryUnit).filter(InventoryUnit.id == unit_id).first()
    if not unit:
        raise NotFoundError("Inventory unit not found.")

    if unit.status == payload.status:
        return get_inventory_unit(db, unit.id)

    active_booking = (
        db.query(Booking)
        .filter(
            Booking.inventory_unit_id == unit.id,
            Booking.status.in_(["Pending", "Confirmed"]),
        )
        .first()
    )

    # Guard against status changes that violate booking/sales history
    if active_booking and payload.status in ("Available", "Cancelled"):
        raise BusinessRuleError(
            "Cannot set unit to Available/Cancelled while an active booking exists. Cancel the booking via Booking Management."
        )

    if payload.status in ("Reserved", "Booked") and not active_booking:
        raise BusinessRuleError(
            "Reserved and Booked statuses must be created through the Booking workflow."
        )

    if payload.status == "Sold":
        if unit.status != "Booked" or not active_booking or active_booking.status != "Confirmed":
            raise BusinessRuleError("Only a unit with a Confirmed booking can transition to Sold.")

    if payload.status == "Handover Complete" and unit.status != "Sold":
        raise BusinessRuleError("Unit must be in Sold status before marking Handover Complete.")

    if unit.status in ("Sold", "Handover Complete") and payload.status == "Available":
        raise BusinessRuleError("Cannot revert a completed sale back to Available.")

    prev = unit.status
    unit.status = payload.status
    db.add(
        InventoryStatusHistory(
            inventory_unit_id=unit.id,
            previous_status=prev,
            new_status=payload.status,
            changed_by_id=actor.id,
            booking_id=active_booking.id if active_booking else None,
            reason=payload.reason.strip(),
        )
    )
    record_activity(
        db,
        employee_id=actor.id,
        action="INVENTORY_STATUS_CHANGED",
        entity_type="inventory_unit",
        entity_id=unit.id,
        metadata={"previous_status": prev, "new_status": payload.status, "reason": payload.reason},
        ip_address=ip_address,
    )
    db.commit()
    return get_inventory_unit(db, unit.id)
