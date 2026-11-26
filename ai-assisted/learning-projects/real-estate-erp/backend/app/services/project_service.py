from decimal import Decimal
from typing import Optional
import uuid
from sqlalchemy import case, func, or_
from sqlalchemy.orm import Session, joinedload

from app.core.exceptions import BusinessRuleError, ConflictError, NotFoundError
from app.models.auth import Employee
from app.models.booking_collection import Booking, Collection
from app.models.project_inventory import InventoryUnit, Project
from app.models.support_audit import Complaint
from app.schemas.project_inventory import ProjectCreate, ProjectRead, ProjectStats, ProjectUpdate
from app.services.audit_service import record_activity
from app.utils.helpers import calculate_pagination


def _build_project_stats(db: Session, project_id: uuid.UUID) -> ProjectStats:
    unit_counts = (
        db.query(
            func.count(InventoryUnit.id).label("total"),
            func.sum(case((InventoryUnit.status == "Available", 1), else_=0)).label("available"),
            func.sum(case((InventoryUnit.status == "Reserved", 1), else_=0)).label("reserved"),
            func.sum(case((InventoryUnit.status == "Booked", 1), else_=0)).label("booked"),
            func.sum(case((InventoryUnit.status.in_(["Sold", "Handover Complete"]), 1), else_=0)).label("sold"),
        )
        .filter(InventoryUnit.project_id == project_id)
        .first()
    )

    booking_agg = (
        db.query(
            func.count(Booking.id).label("total_bookings"),
            func.coalesce(func.sum(Booking.final_agreed_price), Decimal("0.00")).label("total_value"),
        )
        .filter(Booking.project_id == project_id, Booking.status != "Cancelled")
        .first()
    )

    collected_sum = (
        db.query(func.coalesce(func.sum(Collection.payment_amount), Decimal("0.00")))
        .join(Booking, Collection.booking_id == Booking.id)
        .filter(
            Booking.project_id == project_id,
            Collection.is_reversed.is_(False),
            Collection.payment_type.in_(["Booking Payment", "Partial Payment", "Other Payment"]),
        )
        .scalar()
    ) or Decimal("0.00")

    refunded_sum = (
        db.query(func.coalesce(func.sum(Collection.payment_amount), Decimal("0.00")))
        .join(Booking, Collection.booking_id == Booking.id)
        .filter(
            Booking.project_id == project_id,
            Collection.is_reversed.is_(False),
            Collection.payment_type == "Refund",
        )
        .scalar()
    ) or Decimal("0.00")

    return ProjectStats(
        total_units=int(unit_counts.total or 0),
        available_units=int(unit_counts.available or 0),
        reserved_units=int(unit_counts.reserved or 0),
        booked_units=int(unit_counts.booked or 0),
        sold_units=int(unit_counts.sold or 0),
        total_bookings=int(booking_agg.total_bookings or 0),
        total_booking_value=Decimal(booking_agg.total_value or 0),
        total_collected=Decimal(collected_sum) - Decimal(refunded_sum),
    )


def _to_project_read(db: Session, proj: Project, include_stats: bool = True) -> ProjectRead:
    return ProjectRead(
        id=proj.id,
        project_code=proj.project_code,
        name=proj.name,
        description=proj.description,
        location=proj.location,
        address=proj.address,
        project_type=proj.project_type,
        total_land_area=proj.total_land_area,
        number_of_buildings=proj.number_of_buildings,
        start_date=proj.start_date,
        expected_completion_date=proj.expected_completion_date,
        status=proj.status,
        image_url=proj.image_url,
        is_archived=proj.is_archived,
        created_by_id=proj.created_by_id,
        created_by_name=proj.created_by.full_name if proj.created_by else None,
        created_at=proj.created_at,
        updated_at=proj.updated_at,
        stats=_build_project_stats(db, proj.id) if include_stats else None,
    )


def list_projects(
    db: Session,
    search: Optional[str] = None,
    status: Optional[str] = None,
    project_type: Optional[str] = None,
    include_archived: bool = False,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    page: int = 1,
    page_size: int = 20,
):
    query = db.query(Project).options(joinedload(Project.created_by))
    if not include_archived:
        query = query.filter(Project.is_archived.is_(False))
    if search:
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Project.name.ilike(term),
                Project.project_code.ilike(term),
                Project.location.ilike(term),
            )
        )
    if status:
        query = query.filter(Project.status == status)
    if project_type:
        query = query.filter(Project.project_type == project_type)

    sort_col_map = {
        "name": Project.name,
        "project_code": Project.project_code,
        "status": Project.status,
        "created_at": Project.created_at,
        "expected_completion_date": Project.expected_completion_date,
    }
    sort_col = sort_col_map.get(sort_by, Project.created_at)
    order_expr = sort_col.asc() if sort_order == "asc" else sort_col.desc()

    total = query.count()
    safe_page, total_pages = calculate_pagination(total, page, page_size)
    rows = query.order_by(order_expr).offset((safe_page - 1) * page_size).limit(page_size).all()

    return {
        "items": [_to_project_read(db, p, include_stats=True) for p in rows],
        "total": total,
        "page": safe_page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


def get_project(db: Session, project_id: uuid.UUID) -> ProjectRead:
    proj = (
        db.query(Project)
        .options(joinedload(Project.created_by))
        .filter(Project.id == project_id)
        .first()
    )
    if not proj:
        raise NotFoundError("Project not found.")
    return _to_project_read(db, proj, include_stats=True)


def create_project(
    db: Session,
    payload: ProjectCreate,
    actor: Employee,
    ip_address: Optional[str] = None,
) -> ProjectRead:
    code = payload.project_code.strip().upper()
    if db.query(Project).filter(Project.project_code == code).first():
        raise ConflictError(f"Project code '{code}' already exists.")

    if payload.start_date and payload.expected_completion_date and payload.expected_completion_date < payload.start_date:
        raise BusinessRuleError("Expected completion date cannot precede project start date.")

    proj = Project(
        project_code=code,
        name=payload.name.strip(),
        description=payload.description,
        location=payload.location.strip(),
        address=payload.address.strip(),
        project_type=payload.project_type.strip(),
        total_land_area=payload.total_land_area,
        number_of_buildings=payload.number_of_buildings,
        start_date=payload.start_date,
        expected_completion_date=payload.expected_completion_date,
        status=payload.status,
        image_url=payload.image_url,
        created_by_id=actor.id,
    )
    db.add(proj)
    db.flush()

    record_activity(
        db,
        employee_id=actor.id,
        action="PROJECT_CREATED",
        entity_type="project",
        entity_id=proj.id,
        metadata={"project_code": proj.project_code, "name": proj.name},
        ip_address=ip_address,
    )
    db.commit()
    return get_project(db, proj.id)


def update_project(
    db: Session,
    project_id: uuid.UUID,
    payload: ProjectUpdate,
    actor: Employee,
    ip_address: Optional[str] = None,
) -> ProjectRead:
    proj = db.query(Project).filter(Project.id == project_id).first()
    if not proj:
        raise NotFoundError("Project not found.")

    update_data = payload.model_dump(exclude_unset=True)
    start_d = update_data.get("start_date", proj.start_date)
    end_d = update_data.get("expected_completion_date", proj.expected_completion_date)
    if start_d and end_d and end_d < start_d:
        raise BusinessRuleError("Expected completion date cannot precede project start date.")

    for field, value in update_data.items():
        setattr(proj, field, value.strip() if isinstance(value, str) else value)

    record_activity(
        db,
        employee_id=actor.id,
        action="PROJECT_UPDATED",
        entity_type="project",
        entity_id=proj.id,
        metadata={"updated_fields": list(update_data.keys())},
        ip_address=ip_address,
    )
    db.commit()
    return get_project(db, proj.id)


def archive_project(
    db: Session,
    project_id: uuid.UUID,
    actor: Employee,
    ip_address: Optional[str] = None,
) -> ProjectRead:
    proj = db.query(Project).filter(Project.id == project_id).first()
    if not proj:
        raise NotFoundError("Project not found.")

    active_bookings = (
        db.query(func.count(Booking.id))
        .filter(Booking.project_id == project_id, Booking.status.in_(["Pending", "Confirmed"]))
        .scalar()
    )
    if active_bookings and active_bookings > 0:
        raise BusinessRuleError("Cannot archive a project with active bookings.")

    proj.is_archived = True
    record_activity(
        db,
        employee_id=actor.id,
        action="PROJECT_ARCHIVED",
        entity_type="project",
        entity_id=proj.id,
        metadata={"project_code": proj.project_code},
        ip_address=ip_address,
    )
    db.commit()
    return get_project(db, proj.id)


def delete_project(
    db: Session,
    project_id: uuid.UUID,
    actor: Employee,
    ip_address: Optional[str] = None,
) -> None:
    proj = db.query(Project).filter(Project.id == project_id).first()
    if not proj:
        raise NotFoundError("Project not found.")

    has_units = db.query(InventoryUnit.id).filter(InventoryUnit.project_id == project_id).first()
    has_bookings = db.query(Booking.id).filter(Booking.project_id == project_id).first()
    has_complaints = db.query(Complaint.id).filter(Complaint.project_id == project_id).first()
    if has_units or has_bookings or has_complaints:
        raise ConflictError(
            "Project has associated inventory, bookings, or complaints. Use safe archival instead of deletion."
        )

    code = proj.project_code
    db.delete(proj)
    record_activity(
        db,
        employee_id=actor.id,
        action="PROJECT_DELETED",
        entity_type="project",
        entity_id=project_id,
        metadata={"project_code": code},
        ip_address=ip_address,
    )
    db.commit()
