from datetime import datetime, timezone
from typing import Optional
import uuid
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from app.core.exceptions import BusinessRuleError, NotFoundError
from app.models.auth import Employee
from app.models.crm import Customer
from app.models.project_inventory import InventoryUnit, Project
from app.models.support_audit import Complaint, ComplaintStatusHistory
from app.schemas.support_reports import ComplaintCreate, ComplaintHistoryRead, ComplaintRead, ComplaintUpdate
from app.services.audit_service import record_activity
from app.utils.helpers import calculate_pagination, generate_reference


def _to_complaint_read(c: Complaint, include_history: bool = False) -> ComplaintRead:
    history = []
    if include_history:
        history = [
            ComplaintHistoryRead(
                id=h.id,
                complaint_id=h.complaint_id,
                previous_status=h.previous_status,
                new_status=h.new_status,
                previous_priority=h.previous_priority,
                new_priority=h.new_priority,
                assigned_employee_id=h.assigned_employee_id,
                changed_by_id=h.changed_by_id,
                changed_by_name=h.changed_by.full_name if h.changed_by else None,
                note=h.note,
                created_at=h.created_at,
            )
            for h in (c.history or [])
        ]
    return ComplaintRead(
        id=c.id,
        complaint_reference=c.complaint_reference,
        customer_id=c.customer_id,
        customer_name=c.customer.full_name if c.customer else None,
        project_id=c.project_id,
        project_name=c.project.name if c.project else None,
        inventory_unit_id=c.inventory_unit_id,
        unit_number=c.inventory_unit.unit_number if c.inventory_unit else None,
        subject=c.subject,
        description=c.description,
        category=c.category,
        priority=c.priority,
        assigned_employee_id=c.assigned_employee_id,
        assigned_employee_name=c.assigned_employee.full_name if c.assigned_employee else None,
        status=c.status,
        resolution_details=c.resolution_details,
        resolved_at=c.resolved_at,
        created_by_id=c.created_by_id,
        created_at=c.created_at,
        updated_at=c.updated_at,
        history=history,
    )


def list_complaints(
    db: Session,
    search: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    customer_id: Optional[uuid.UUID] = None,
    assigned_employee_id: Optional[uuid.UUID] = None,
    project_id: Optional[uuid.UUID] = None,
    page: int = 1,
    page_size: int = 20,
):
    query = db.query(Complaint).options(
        joinedload(Complaint.customer),
        joinedload(Complaint.project),
        joinedload(Complaint.inventory_unit),
        joinedload(Complaint.assigned_employee),
    )

    if status:
        query = query.filter(Complaint.status == status)
    if priority:
        query = query.filter(Complaint.priority == priority)
    if customer_id:
        query = query.filter(Complaint.customer_id == customer_id)
    if assigned_employee_id:
        query = query.filter(Complaint.assigned_employee_id == assigned_employee_id)
    if project_id:
        query = query.filter(Complaint.project_id == project_id)
    if search:
        term = f"%{search.strip()}%"
        query = query.join(Complaint.customer).filter(
            or_(
                Complaint.complaint_reference.ilike(term),
                Complaint.subject.ilike(term),
                Complaint.category.ilike(term),
                Customer.full_name.ilike(term),
            )
        )

    total = query.count()
    safe_page, total_pages = calculate_pagination(total, page, page_size)
    rows = (
        query.order_by(Complaint.created_at.desc())
        .offset((safe_page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return {
        "items": [_to_complaint_read(c, include_history=False) for c in rows],
        "total": total,
        "page": safe_page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


def get_complaint(db: Session, complaint_id: uuid.UUID) -> ComplaintRead:
    c = (
        db.query(Complaint)
        .options(
            joinedload(Complaint.customer),
            joinedload(Complaint.project),
            joinedload(Complaint.inventory_unit),
            joinedload(Complaint.assigned_employee),
            joinedload(Complaint.history).joinedload(ComplaintStatusHistory.changed_by),
        )
        .filter(Complaint.id == complaint_id)
        .first()
    )
    if not c:
        raise NotFoundError("Complaint not found.")
    return _to_complaint_read(c, include_history=True)


def create_complaint(
    db: Session,
    payload: ComplaintCreate,
    actor: Employee,
    ip_address: Optional[str] = None,
) -> ComplaintRead:
    customer = db.query(Customer).filter(Customer.id == payload.customer_id).first()
    if not customer:
        raise NotFoundError("Customer not found.")
    project = db.query(Project).filter(Project.id == payload.project_id).first()
    if not project:
        raise NotFoundError("Project not found.")

    if payload.inventory_unit_id:
        unit = db.query(InventoryUnit).filter(InventoryUnit.id == payload.inventory_unit_id).first()
        if not unit or unit.project_id != project.id:
            raise BusinessRuleError("Selected unit does not belong to the specified project.")

    complaint = Complaint(
        complaint_reference=generate_reference("CMP"),
        customer_id=customer.id,
        project_id=project.id,
        inventory_unit_id=payload.inventory_unit_id,
        subject=payload.subject.strip(),
        description=payload.description.strip(),
        category=payload.category.strip(),
        priority=payload.priority,
        assigned_employee_id=payload.assigned_employee_id,
        status="Open",
        created_by_id=actor.id,
    )
    db.add(complaint)
    db.flush()

    db.add(
        ComplaintStatusHistory(
            complaint_id=complaint.id,
            previous_status=None,
            new_status="Open",
            previous_priority=None,
            new_priority=complaint.priority,
            assigned_employee_id=complaint.assigned_employee_id,
            changed_by_id=actor.id,
            note="Complaint logged",
        )
    )
    record_activity(
        db,
        employee_id=actor.id,
        action="COMPLAINT_CREATED",
        entity_type="complaint",
        entity_id=complaint.id,
        metadata={"complaint_reference": complaint.complaint_reference, "priority": complaint.priority},
        ip_address=ip_address,
    )
    db.commit()
    return get_complaint(db, complaint.id)


def update_complaint(
    db: Session,
    complaint_id: uuid.UUID,
    payload: ComplaintUpdate,
    actor: Employee,
    ip_address: Optional[str] = None,
) -> ComplaintRead:
    c = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not c:
        raise NotFoundError("Complaint not found.")

    prev_status = c.status
    prev_priority = c.priority

    if payload.priority is not None:
        c.priority = payload.priority
    if payload.assigned_employee_id is not None:
        c.assigned_employee_id = payload.assigned_employee_id
    if payload.resolution_details is not None:
        c.resolution_details = payload.resolution_details.strip()
    if payload.status is not None:
        if payload.status in ("Resolved", "Closed") and not (c.resolution_details or payload.resolution_details):
            raise BusinessRuleError("Resolution details are required when resolving or closing a complaint.")
        c.status = payload.status
        if payload.status == "Resolved" and not c.resolved_at:
            c.resolved_at = datetime.now(timezone.utc)

    db.add(
        ComplaintStatusHistory(
            complaint_id=c.id,
            previous_status=prev_status,
            new_status=c.status,
            previous_priority=prev_priority,
            new_priority=c.priority,
            assigned_employee_id=c.assigned_employee_id,
            changed_by_id=actor.id,
            note=payload.note or payload.resolution_details or "Complaint updated",
        )
    )
    record_activity(
        db,
        employee_id=actor.id,
        action="COMPLAINT_UPDATED",
        entity_type="complaint",
        entity_id=c.id,
        metadata={
            "complaint_reference": c.complaint_reference,
            "previous_status": prev_status,
            "new_status": c.status,
            "priority": c.priority,
        },
        ip_address=ip_address,
    )
    db.commit()
    return get_complaint(db, c.id)
