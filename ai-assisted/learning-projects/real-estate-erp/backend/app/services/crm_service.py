from typing import Optional
import uuid
from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload

from app.core.exceptions import BusinessRuleError, ConflictError, ForbiddenError, NotFoundError
from app.core.permissions import RoleName
from app.models.auth import Employee
from app.models.booking_collection import Booking, Collection
from app.models.crm import Customer, Lead
from app.models.project_inventory import Project
from app.models.support_audit import Complaint
from app.schemas.crm import (
    CustomerCreate,
    CustomerRead,
    CustomerUpdate,
    LeadConvertRequest,
    LeadCreate,
    LeadRead,
    LeadUpdate,
)
from app.services.audit_service import record_activity
from app.utils.helpers import calculate_pagination, generate_reference


def _to_customer_read(c: Customer) -> CustomerRead:
    return CustomerRead(
        id=c.id,
        customer_code=c.customer_code,
        full_name=c.full_name,
        phone=c.phone,
        email=c.email,
        address=c.address,
        nationality=c.nationality,
        occupation=c.occupation,
        identification_reference=c.identification_reference,
        notes=c.notes,
        assigned_sales_executive_id=c.assigned_sales_executive_id,
        assigned_sales_executive_name=(
            c.assigned_sales_executive.full_name if c.assigned_sales_executive else None
        ),
        is_archived=c.is_archived,
        created_by_id=c.created_by_id,
        created_at=c.created_at,
        updated_at=c.updated_at,
    )


def _to_lead_read(l: Lead) -> LeadRead:
    return LeadRead(
        id=l.id,
        lead_code=l.lead_code,
        customer_name=l.customer_name,
        contact_number=l.contact_number,
        email=l.email,
        interested_project_id=l.interested_project_id,
        interested_project_name=l.interested_project.name if l.interested_project else None,
        interested_unit_type=l.interested_unit_type,
        budget_min=l.budget_min,
        budget_max=l.budget_max,
        lead_source=l.lead_source,
        assigned_employee_id=l.assigned_employee_id,
        assigned_employee_name=l.assigned_employee.full_name if l.assigned_employee else None,
        follow_up_date=l.follow_up_date,
        status=l.status,
        converted_customer_id=l.converted_customer_id,
        notes=l.notes,
        created_by_id=l.created_by_id,
        created_at=l.created_at,
        updated_at=l.updated_at,
    )


def list_customers(
    db: Session,
    actor: Employee,
    search: Optional[str] = None,
    assigned_sales_executive_id: Optional[uuid.UUID] = None,
    include_archived: bool = False,
    page: int = 1,
    page_size: int = 20,
):
    query = db.query(Customer).options(joinedload(Customer.assigned_sales_executive))
    if not include_archived:
        query = query.filter(Customer.is_archived.is_(False))

    if actor.role and actor.role.name == RoleName.SALES_EXECUTIVE.value:
        query = query.filter(
            or_(
                Customer.assigned_sales_executive_id == actor.id,
                Customer.created_by_id == actor.id,
            )
        )
    elif assigned_sales_executive_id:
        query = query.filter(Customer.assigned_sales_executive_id == assigned_sales_executive_id)

    if search:
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Customer.full_name.ilike(term),
                Customer.phone.ilike(term),
                Customer.email.ilike(term),
                Customer.customer_code.ilike(term),
            )
        )

    total = query.count()
    safe_page, total_pages = calculate_pagination(total, page, page_size)
    rows = (
        query.order_by(Customer.created_at.desc())
        .offset((safe_page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return {
        "items": [_to_customer_read(c) for c in rows],
        "total": total,
        "page": safe_page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


def get_customer(db: Session, customer_id: uuid.UUID, actor: Employee) -> CustomerRead:
    c = (
        db.query(Customer)
        .options(joinedload(Customer.assigned_sales_executive))
        .filter(Customer.id == customer_id)
        .first()
    )
    if not c:
        raise NotFoundError("Customer not found.")

    if (
        actor.role
        and actor.role.name == RoleName.SALES_EXECUTIVE.value
        and c.assigned_sales_executive_id != actor.id
        and c.created_by_id != actor.id
    ):
        raise ForbiddenError("You can only view customers assigned to you.")
    return _to_customer_read(c)


def get_customer_profile(db: Session, customer_id: uuid.UUID, actor: Employee) -> dict:
    customer = get_customer(db, customer_id, actor)
    bookings = (
        db.query(Booking)
        .options(joinedload(Booking.project), joinedload(Booking.inventory_unit))
        .filter(Booking.customer_id == customer_id)
        .order_by(Booking.created_at.desc())
        .all()
    )
    collections = (
        db.query(Collection)
        .filter(Collection.customer_id == customer_id)
        .order_by(Collection.payment_date.desc(), Collection.created_at.desc())
        .all()
    )
    complaints = (
        db.query(Complaint)
        .options(joinedload(Complaint.project))
        .filter(Complaint.customer_id == customer_id)
        .order_by(Complaint.created_at.desc())
        .all()
    )
    return {
        "customer": customer.model_dump(),
        "bookings": [
            {
                "id": str(b.id),
                "booking_reference": b.booking_reference,
                "project_name": b.project.name if b.project else None,
                "unit_number": b.inventory_unit.unit_number if b.inventory_unit else None,
                "booking_date": b.booking_date.isoformat(),
                "final_agreed_price": str(b.final_agreed_price),
                "status": b.status,
            }
            for b in bookings
        ],
        "collections": [
            {
                "id": str(col.id),
                "collection_reference": col.collection_reference,
                "payment_date": col.payment_date.isoformat(),
                "payment_amount": str(col.payment_amount),
                "payment_method": col.payment_method,
                "payment_type": col.payment_type,
                "is_reversed": col.is_reversed,
            }
            for col in collections
        ],
        "complaints": [
            {
                "id": str(cmp.id),
                "complaint_reference": cmp.complaint_reference,
                "subject": cmp.subject,
                "project_name": cmp.project.name if cmp.project else None,
                "priority": cmp.priority,
                "status": cmp.status,
                "created_at": cmp.created_at.isoformat(),
            }
            for cmp in complaints
        ],
    }


def create_customer(
    db: Session,
    payload: CustomerCreate,
    actor: Employee,
    ip_address: Optional[str] = None,
) -> CustomerRead:
    phone_clean = payload.phone.strip()
    email_clean = payload.email.lower().strip() if payload.email else None

    if not payload.confirm_duplicate:
        dup_filters = [Customer.phone == phone_clean]
        if email_clean:
            dup_filters.append(func.lower(Customer.email) == email_clean)
        existing = db.query(Customer).filter(or_(*dup_filters), Customer.is_archived.is_(False)).first()
        if existing:
            raise ConflictError(
                f"Potential duplicate customer found: {existing.full_name} ({existing.customer_code}, {existing.phone}). Set confirm_duplicate=true to create anyway."
            )

    assigned_id = payload.assigned_sales_executive_id
    if actor.role and actor.role.name == RoleName.SALES_EXECUTIVE.value and not assigned_id:
        assigned_id = actor.id

    customer = Customer(
        customer_code=generate_reference("CUST"),
        full_name=payload.full_name.strip(),
        phone=phone_clean,
        email=email_clean,
        address=payload.address,
        nationality=payload.nationality,
        occupation=payload.occupation,
        identification_reference=payload.identification_reference,
        notes=payload.notes,
        assigned_sales_executive_id=assigned_id,
        created_by_id=actor.id,
    )
    db.add(customer)
    db.flush()

    record_activity(
        db,
        employee_id=actor.id,
        action="CUSTOMER_CREATED",
        entity_type="customer",
        entity_id=customer.id,
        metadata={"customer_code": customer.customer_code, "full_name": customer.full_name},
        ip_address=ip_address,
    )
    db.commit()
    return get_customer(db, customer.id, actor)


def update_customer(
    db: Session,
    customer_id: uuid.UUID,
    payload: CustomerUpdate,
    actor: Employee,
    ip_address: Optional[str] = None,
) -> CustomerRead:
    c = db.query(Customer).filter(Customer.id == customer_id).first()
    if not c:
        raise NotFoundError("Customer not found.")
    if (
        actor.role
        and actor.role.name == RoleName.SALES_EXECUTIVE.value
        and c.assigned_sales_executive_id != actor.id
        and c.created_by_id != actor.id
    ):
        raise ForbiddenError("You can only edit customers assigned to you.")

    data = payload.model_dump(exclude_unset=True)
    if "email" in data and data["email"]:
        data["email"] = data["email"].lower().strip()
    for k, v in data.items():
        setattr(c, k, v.strip() if isinstance(v, str) else v)

    record_activity(
        db,
        employee_id=actor.id,
        action="CUSTOMER_UPDATED",
        entity_type="customer",
        entity_id=c.id,
        metadata={"updated_fields": list(data.keys())},
        ip_address=ip_address,
    )
    db.commit()
    return get_customer(db, c.id, actor)


def list_leads(
    db: Session,
    actor: Employee,
    search: Optional[str] = None,
    status: Optional[str] = None,
    assigned_employee_id: Optional[uuid.UUID] = None,
    interested_project_id: Optional[uuid.UUID] = None,
    page: int = 1,
    page_size: int = 20,
):
    query = db.query(Lead).options(
        joinedload(Lead.interested_project),
        joinedload(Lead.assigned_employee),
    )
    if actor.role and actor.role.name == RoleName.SALES_EXECUTIVE.value:
        query = query.filter(
            or_(
                Lead.assigned_employee_id == actor.id,
                Lead.created_by_id == actor.id,
            )
        )
    elif assigned_employee_id:
        query = query.filter(Lead.assigned_employee_id == assigned_employee_id)

    if status:
        query = query.filter(Lead.status == status)
    if interested_project_id:
        query = query.filter(Lead.interested_project_id == interested_project_id)
    if search:
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Lead.customer_name.ilike(term),
                Lead.contact_number.ilike(term),
                Lead.email.ilike(term),
                Lead.lead_code.ilike(term),
            )
        )

    total = query.count()
    safe_page, total_pages = calculate_pagination(total, page, page_size)
    rows = (
        query.order_by(Lead.created_at.desc())
        .offset((safe_page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return {
        "items": [_to_lead_read(l) for l in rows],
        "total": total,
        "page": safe_page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


def get_lead(db: Session, lead_id: uuid.UUID, actor: Employee) -> LeadRead:
    lead = (
        db.query(Lead)
        .options(joinedload(Lead.interested_project), joinedload(Lead.assigned_employee))
        .filter(Lead.id == lead_id)
        .first()
    )
    if not lead:
        raise NotFoundError("Lead not found.")
    if (
        actor.role
        and actor.role.name == RoleName.SALES_EXECUTIVE.value
        and lead.assigned_employee_id != actor.id
        and lead.created_by_id != actor.id
    ):
        raise ForbiddenError("You can only access leads assigned to you.")
    return _to_lead_read(lead)


def create_lead(
    db: Session,
    payload: LeadCreate,
    actor: Employee,
    ip_address: Optional[str] = None,
) -> LeadRead:
    if payload.interested_project_id:
        proj = db.query(Project).filter(Project.id == payload.interested_project_id).first()
        if not proj:
            raise NotFoundError("Interested project not found.")

    if payload.budget_min is not None and payload.budget_max is not None and payload.budget_min > payload.budget_max:
        raise BusinessRuleError("Minimum budget cannot exceed maximum budget.")

    assigned_id = payload.assigned_employee_id
    if actor.role and actor.role.name == RoleName.SALES_EXECUTIVE.value and not assigned_id:
        assigned_id = actor.id

    lead = Lead(
        lead_code=generate_reference("LEAD"),
        customer_name=payload.customer_name.strip(),
        contact_number=payload.contact_number.strip(),
        email=payload.email.lower().strip() if payload.email else None,
        interested_project_id=payload.interested_project_id,
        interested_unit_type=payload.interested_unit_type,
        budget_min=payload.budget_min,
        budget_max=payload.budget_max,
        lead_source=payload.lead_source,
        assigned_employee_id=assigned_id,
        follow_up_date=payload.follow_up_date,
        status=payload.status,
        notes=payload.notes,
        created_by_id=actor.id,
    )
    db.add(lead)
    db.flush()

    record_activity(
        db,
        employee_id=actor.id,
        action="LEAD_CREATED",
        entity_type="lead",
        entity_id=lead.id,
        metadata={"lead_code": lead.lead_code, "status": lead.status},
        ip_address=ip_address,
    )
    db.commit()
    return get_lead(db, lead.id, actor)


def update_lead(
    db: Session,
    lead_id: uuid.UUID,
    payload: LeadUpdate,
    actor: Employee,
    ip_address: Optional[str] = None,
) -> LeadRead:
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise NotFoundError("Lead not found.")
    if (
        actor.role
        and actor.role.name == RoleName.SALES_EXECUTIVE.value
        and lead.assigned_employee_id != actor.id
        and lead.created_by_id != actor.id
    ):
        raise ForbiddenError("You can only modify leads assigned to you.")

    if lead.status == "Converted" and payload.status and payload.status != "Converted":
        raise BusinessRuleError("Cannot revert a converted lead status.")

    data = payload.model_dump(exclude_unset=True)
    if "email" in data and data["email"]:
        data["email"] = data["email"].lower().strip()
    for k, v in data.items():
        setattr(lead, k, v.strip() if isinstance(v, str) else v)

    if lead.budget_min is not None and lead.budget_max is not None and lead.budget_min > lead.budget_max:
        raise BusinessRuleError("Minimum budget cannot exceed maximum budget.")

    record_activity(
        db,
        employee_id=actor.id,
        action="LEAD_UPDATED",
        entity_type="lead",
        entity_id=lead.id,
        metadata={"updated_fields": list(data.keys()), "status": lead.status},
        ip_address=ip_address,
    )
    db.commit()
    return get_lead(db, lead.id, actor)


def convert_lead_to_customer(
    db: Session,
    lead_id: uuid.UUID,
    payload: LeadConvertRequest,
    actor: Employee,
    ip_address: Optional[str] = None,
) -> CustomerRead:
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise NotFoundError("Lead not found.")
    if (
        actor.role
        and actor.role.name == RoleName.SALES_EXECUTIVE.value
        and lead.assigned_employee_id != actor.id
        and lead.created_by_id != actor.id
    ):
        raise ForbiddenError("You can only convert leads assigned to you.")

    if lead.status == "Converted" and lead.converted_customer_id:
        raise ConflictError("Lead has already been converted to a customer.")
    if lead.status == "Lost":
        raise BusinessRuleError("Cannot convert a Lost lead directly. Re-open the lead first.")

    customer = Customer(
        customer_code=generate_reference("CUST"),
        full_name=lead.customer_name,
        phone=lead.contact_number,
        email=lead.email,
        address=payload.address,
        nationality=payload.nationality,
        occupation=payload.occupation,
        notes=payload.notes or lead.notes,
        assigned_sales_executive_id=lead.assigned_employee_id or actor.id,
        created_by_id=actor.id,
    )
    db.add(customer)
    db.flush()

    lead.status = "Converted"
    lead.converted_customer_id = customer.id

    record_activity(
        db,
        employee_id=actor.id,
        action="LEAD_CONVERTED",
        entity_type="lead",
        entity_id=lead.id,
        metadata={"customer_id": str(customer.id), "customer_code": customer.customer_code},
        ip_address=ip_address,
    )
    db.commit()
    return get_customer(db, customer.id, actor)
