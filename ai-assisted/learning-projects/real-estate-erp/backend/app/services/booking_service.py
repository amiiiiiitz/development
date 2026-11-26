from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Optional
import uuid
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.core.exceptions import BusinessRuleError, ConflictError, ForbiddenError, NotFoundError
from app.core.permissions import RoleName
from app.models.auth import Employee
from app.models.booking_collection import Booking, BookingStatusHistory, Collection
from app.models.crm import Customer
from app.models.project_inventory import InventoryStatusHistory, InventoryUnit
from app.schemas.booking_collection import BookingCreate, BookingRead, BookingStatusHistoryRead
from app.services.audit_service import record_activity
from app.utils.helpers import calculate_pagination, generate_reference


def compute_booking_financials(booking: Booking) -> tuple[Decimal, Decimal, Decimal]:
    collections = booking.collections or []
    total_collected = sum(
        (
            Decimal(c.payment_amount)
            for c in collections
            if not c.is_reversed
            and c.payment_type in ("Booking Payment", "Partial Payment", "Other Payment")
        ),
        Decimal("0.00"),
    )
    total_refunded = sum(
        (
            Decimal(c.payment_amount)
            for c in collections
            if not c.is_reversed and c.payment_type == "Refund"
        ),
        Decimal("0.00"),
    )
    net_collected = total_collected - total_refunded
    if booking.status == "Cancelled":
        outstanding = Decimal("0.00")
    else:
        outstanding = max(Decimal("0.00"), Decimal(booking.final_agreed_price) - net_collected)
    return total_collected, total_refunded, outstanding


def _to_booking_read(b: Booking, include_history: bool = False) -> BookingRead:
    total_collected, total_refunded, outstanding = compute_booking_financials(b)
    history = []
    if include_history:
        history = [
            BookingStatusHistoryRead(
                id=h.id,
                booking_id=h.booking_id,
                previous_status=h.previous_status,
                new_status=h.new_status,
                changed_by_id=h.changed_by_id,
                changed_by_name=h.changed_by.full_name if h.changed_by else None,
                reason=h.reason,
                created_at=h.created_at,
            )
            for h in (b.status_history or [])
        ]
    return BookingRead(
        id=b.id,
        booking_reference=b.booking_reference,
        customer_id=b.customer_id,
        customer_name=b.customer.full_name if b.customer else None,
        customer_phone=b.customer.phone if b.customer else None,
        project_id=b.project_id,
        project_name=b.project.name if b.project else None,
        inventory_unit_id=b.inventory_unit_id,
        unit_number=b.inventory_unit.unit_number if b.inventory_unit else None,
        unit_type=b.inventory_unit.unit_type if b.inventory_unit else None,
        assigned_sales_executive_id=b.assigned_sales_executive_id,
        assigned_sales_executive_name=(
            b.assigned_sales_executive.full_name if b.assigned_sales_executive else None
        ),
        booking_date=b.booking_date,
        unit_price_at_booking=b.unit_price_at_booking,
        discount=b.discount,
        final_agreed_price=b.final_agreed_price,
        initial_booking_amount=b.initial_booking_amount,
        payment_method=b.payment_method,
        status=b.status,
        total_collected=total_collected,
        total_refunded=total_refunded,
        outstanding_balance=outstanding,
        cancellation_reason=b.cancellation_reason,
        cancelled_at=b.cancelled_at,
        notes=b.notes,
        created_by_id=b.created_by_id,
        created_at=b.created_at,
        updated_at=b.updated_at,
        status_history=history,
    )


def list_bookings(
    db: Session,
    actor: Employee,
    search: Optional[str] = None,
    project_id: Optional[uuid.UUID] = None,
    customer_id: Optional[uuid.UUID] = None,
    status: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    page: int = 1,
    page_size: int = 20,
):
    query = db.query(Booking).options(
        joinedload(Booking.customer),
        joinedload(Booking.project),
        joinedload(Booking.inventory_unit),
        joinedload(Booking.assigned_sales_executive),
        joinedload(Booking.collections),
    )

    if actor.role and actor.role.name == RoleName.SALES_EXECUTIVE.value:
        query = query.filter(
            or_(
                Booking.assigned_sales_executive_id == actor.id,
                Booking.created_by_id == actor.id,
            )
        )
    elif actor.role and actor.role.name == RoleName.ACCOUNTANT.value and not status:
        # Accountants primarily work with confirmed or cancelled bookings with collections
        query = query.filter(Booking.status.in_(["Confirmed", "Cancelled", "Pending"]))

    if project_id:
        query = query.filter(Booking.project_id == project_id)
    if customer_id:
        query = query.filter(Booking.customer_id == customer_id)
    if status:
        query = query.filter(Booking.status == status)
    if start_date:
        query = query.filter(Booking.booking_date >= start_date)
    if end_date:
        query = query.filter(Booking.booking_date <= end_date)
    if search:
        term = f"%{search.strip()}%"
        query = query.join(Booking.customer).join(Booking.inventory_unit).filter(
            or_(
                Booking.booking_reference.ilike(term),
                Customer.full_name.ilike(term),
                InventoryUnit.unit_number.ilike(term),
            )
        )

    total = query.count()
    safe_page, total_pages = calculate_pagination(total, page, page_size)
    rows = (
        query.order_by(Booking.created_at.desc())
        .offset((safe_page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return {
        "items": [_to_booking_read(b, include_history=False) for b in rows],
        "total": total,
        "page": safe_page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


def get_booking(db: Session, booking_id: uuid.UUID, actor: Employee) -> BookingRead:
    b = (
        db.query(Booking)
        .options(
            joinedload(Booking.customer),
            joinedload(Booking.project),
            joinedload(Booking.inventory_unit),
            joinedload(Booking.assigned_sales_executive),
            joinedload(Booking.collections),
            joinedload(Booking.status_history).joinedload(BookingStatusHistory.changed_by),
        )
        .filter(Booking.id == booking_id)
        .first()
    )
    if not b:
        raise NotFoundError("Booking not found.")
    if (
        actor.role
        and actor.role.name == RoleName.SALES_EXECUTIVE.value
        and b.assigned_sales_executive_id != actor.id
        and b.created_by_id != actor.id
    ):
        raise ForbiddenError("You can only view bookings assigned to you.")
    return _to_booking_read(b, include_history=True)


def create_booking(
    db: Session,
    payload: BookingCreate,
    actor: Employee,
    ip_address: Optional[str] = None,
) -> BookingRead:
    customer = db.query(Customer).filter(Customer.id == payload.customer_id, Customer.is_archived.is_(False)).first()
    if not customer:
        raise NotFoundError("Customer not found or archived.")

    # Row-level lock on inventory_units to prevent concurrent duplicate bookings
    unit_query = db.query(InventoryUnit).filter(InventoryUnit.id == payload.inventory_unit_id)
    if db.bind and db.bind.dialect.name != "sqlite":
        unit_query = unit_query.with_for_update()
    unit = unit_query.first()

    if not unit:
        raise NotFoundError("Inventory unit not found.")
    if unit.project_id != payload.project_id:
        raise BusinessRuleError("Selected inventory unit does not belong to the selected project.")
    if unit.status != "Available":
        raise ConflictError(f"Unit '{unit.unit_number}' is not available (current status: {unit.status}).")

    existing_active = (
        db.query(Booking)
        .filter(
            Booking.inventory_unit_id == unit.id,
            Booking.status.in_(["Pending", "Confirmed"]),
        )
        .first()
    )
    if existing_active:
        raise ConflictError(
            f"Unit '{unit.unit_number}' already has an active booking ({existing_active.booking_reference})."
        )

    unit_price = Decimal(unit.final_selling_price)
    discount = Decimal(payload.discount)
    if discount > unit_price:
        raise BusinessRuleError("Booking discount cannot exceed unit price.")

    final_agreed = unit_price - discount
    initial_amount = Decimal(payload.initial_booking_amount)
    if initial_amount > final_agreed:
        raise BusinessRuleError("Initial booking amount cannot exceed final agreed price.")

    sales_exec_id = payload.assigned_sales_executive_id or customer.assigned_sales_executive_id or actor.id
    booking_status = "Confirmed" if payload.confirm_immediately else "Pending"
    new_unit_status = "Booked" if payload.confirm_immediately else "Reserved"
    booking_date = payload.booking_date or date.today()

    booking = Booking(
        booking_reference=generate_reference("BKG"),
        customer_id=customer.id,
        project_id=unit.project_id,
        inventory_unit_id=unit.id,
        assigned_sales_executive_id=sales_exec_id,
        booking_date=booking_date,
        unit_price_at_booking=unit_price,
        discount=discount,
        final_agreed_price=final_agreed,
        initial_booking_amount=initial_amount,
        payment_method=payload.payment_method,
        status=booking_status,
        notes=payload.notes,
        created_by_id=actor.id,
    )
    db.add(booking)

    try:
        db.flush()
    except IntegrityError:
        db.rollback()
        raise ConflictError(f"Unit '{unit.unit_number}' was booked concurrently by another transaction.")

    prev_unit_status = unit.status
    unit.status = new_unit_status

    db.add(
        InventoryStatusHistory(
            inventory_unit_id=unit.id,
            previous_status=prev_unit_status,
            new_status=new_unit_status,
            changed_by_id=actor.id,
            booking_id=booking.id,
            reason=f"Booking {booking.booking_reference} created ({booking_status})",
        )
    )
    db.add(
        BookingStatusHistory(
            booking_id=booking.id,
            previous_status=None,
            new_status=booking_status,
            changed_by_id=actor.id,
            reason="Initial booking created",
        )
    )

    if initial_amount > Decimal("0.00"):
        db.add(
            Collection(
                collection_reference=generate_reference("COL"),
                booking_id=booking.id,
                customer_id=customer.id,
                payment_amount=initial_amount,
                payment_date=booking_date,
                payment_method=payload.payment_method,
                payment_type="Booking Payment",
                notes=f"Initial booking payment for {booking.booking_reference}",
                recorded_by_id=actor.id,
            )
        )

    record_activity(
        db,
        employee_id=actor.id,
        action="BOOKING_CREATED",
        entity_type="booking",
        entity_id=booking.id,
        metadata={
            "booking_reference": booking.booking_reference,
            "unit_number": unit.unit_number,
            "status": booking_status,
            "final_agreed_price": str(final_agreed),
        },
        ip_address=ip_address,
    )
    db.commit()
    return get_booking(db, booking.id, actor)


def confirm_booking(
    db: Session,
    booking_id: uuid.UUID,
    actor: Employee,
    ip_address: Optional[str] = None,
) -> BookingRead:
    b = db.query(Booking).filter(Booking.id == booking_id).first()
    if not b:
        raise NotFoundError("Booking not found.")
    if (
        actor.role
        and actor.role.name == RoleName.SALES_EXECUTIVE.value
        and b.assigned_sales_executive_id != actor.id
        and b.created_by_id != actor.id
    ):
        raise ForbiddenError("You can only confirm bookings assigned to you.")
    if b.status != "Pending":
        raise BusinessRuleError(f"Only Pending bookings can be confirmed (current status: {b.status}).")

    unit_query = db.query(InventoryUnit).filter(InventoryUnit.id == b.inventory_unit_id)
    if db.bind and db.bind.dialect.name != "sqlite":
        unit_query = unit_query.with_for_update()
    unit = unit_query.first()
    if not unit or unit.status not in ("Reserved", "Available"):
        raise ConflictError("Associated inventory unit is not in a reservable state.")

    b.status = "Confirmed"
    prev_unit_status = unit.status
    unit.status = "Booked"

    db.add(
        BookingStatusHistory(
            booking_id=b.id,
            previous_status="Pending",
            new_status="Confirmed",
            changed_by_id=actor.id,
            reason="Booking confirmed",
        )
    )
    db.add(
        InventoryStatusHistory(
            inventory_unit_id=unit.id,
            previous_status=prev_unit_status,
            new_status="Booked",
            changed_by_id=actor.id,
            booking_id=b.id,
            reason=f"Booking {b.booking_reference} confirmed",
        )
    )
    record_activity(
        db,
        employee_id=actor.id,
        action="BOOKING_CONFIRMED",
        entity_type="booking",
        entity_id=b.id,
        metadata={"booking_reference": b.booking_reference},
        ip_address=ip_address,
    )
    db.commit()
    return get_booking(db, b.id, actor)


def complete_booking_sale(
    db: Session,
    booking_id: uuid.UUID,
    actor: Employee,
    ip_address: Optional[str] = None,
) -> BookingRead:
    b = (
        db.query(Booking)
        .options(joinedload(Booking.collections))
        .filter(Booking.id == booking_id)
        .first()
    )
    if not b:
        raise NotFoundError("Booking not found.")
    if b.status != "Confirmed":
        raise BusinessRuleError("Only Confirmed bookings can be marked as Sold.")

    unit = db.query(InventoryUnit).filter(InventoryUnit.id == b.inventory_unit_id).first()
    if not unit or unit.status != "Booked":
        raise BusinessRuleError("Associated unit must be in Booked status to complete sale.")

    _, _, outstanding = compute_booking_financials(b)
    if outstanding > Decimal("0.00"):
        raise BusinessRuleError(
            f"Cannot mark unit as Sold while outstanding balance remains ({outstanding})."
        )

    prev = unit.status
    unit.status = "Sold"
    db.add(
        InventoryStatusHistory(
            inventory_unit_id=unit.id,
            previous_status=prev,
            new_status="Sold",
            changed_by_id=actor.id,
            booking_id=b.id,
            reason=f"Sale completed for booking {b.booking_reference}",
        )
    )
    record_activity(
        db,
        employee_id=actor.id,
        action="BOOKING_SALE_COMPLETED",
        entity_type="booking",
        entity_id=b.id,
        metadata={"booking_reference": b.booking_reference, "unit_number": unit.unit_number},
        ip_address=ip_address,
    )
    db.commit()
    return get_booking(db, b.id, actor)


def cancel_booking(
    db: Session,
    booking_id: uuid.UUID,
    reason: str,
    actor: Employee,
    ip_address: Optional[str] = None,
) -> BookingRead:
    b = db.query(Booking).filter(Booking.id == booking_id).first()
    if not b:
        raise NotFoundError("Booking not found.")
    if b.status == "Cancelled":
        raise BusinessRuleError("Booking is already cancelled.")

    unit_query = db.query(InventoryUnit).filter(InventoryUnit.id == b.inventory_unit_id)
    if db.bind and db.bind.dialect.name != "sqlite":
        unit_query = unit_query.with_for_update()
    unit = unit_query.first()

    if unit and unit.status in ("Sold", "Handover Complete"):
        raise BusinessRuleError("Cannot cancel a booking for a completed sale or handed-over unit.")

    prev_booking_status = b.status
    b.status = "Cancelled"
    b.cancellation_reason = reason.strip()
    b.cancelled_by_id = actor.id
    b.cancelled_at = datetime.now(timezone.utc)

    db.add(
        BookingStatusHistory(
            booking_id=b.id,
            previous_status=prev_booking_status,
            new_status="Cancelled",
            changed_by_id=actor.id,
            reason=b.cancellation_reason,
        )
    )

    if unit:
        prev_unit_status = unit.status
        unit.status = "Available"
        db.add(
            InventoryStatusHistory(
                inventory_unit_id=unit.id,
                previous_status=prev_unit_status,
                new_status="Available",
                changed_by_id=actor.id,
                booking_id=b.id,
                reason=f"Booking {b.booking_reference} cancelled: {b.cancellation_reason}",
            )
        )

    record_activity(
        db,
        employee_id=actor.id,
        action="BOOKING_CANCELLED",
        entity_type="booking",
        entity_id=b.id,
        metadata={"booking_reference": b.booking_reference, "reason": b.cancellation_reason},
        ip_address=ip_address,
    )
    db.commit()
    return get_booking(db, b.id, actor)
