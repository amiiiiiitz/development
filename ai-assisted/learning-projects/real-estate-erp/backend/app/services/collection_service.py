from datetime import date
from decimal import Decimal
from typing import Optional
import uuid
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from app.core.exceptions import BusinessRuleError, ForbiddenError, NotFoundError
from app.dependencies.auth import get_employee_permissions
from app.models.auth import Employee
from app.models.booking_collection import Booking, Collection
from app.models.crm import Customer
from app.schemas.booking_collection import CollectionCreate, CollectionRead, CollectionSummary
from app.services.audit_service import record_activity
from app.services.booking_service import compute_booking_financials
from app.utils.helpers import calculate_pagination, generate_reference


def _to_collection_read(c: Collection) -> CollectionRead:
    return CollectionRead(
        id=c.id,
        collection_reference=c.collection_reference,
        booking_id=c.booking_id,
        booking_reference=c.booking.booking_reference if c.booking else None,
        customer_id=c.customer_id,
        customer_name=c.customer.full_name if c.customer else None,
        project_name=c.booking.project.name if c.booking and c.booking.project else None,
        unit_number=c.booking.inventory_unit.unit_number if c.booking and c.booking.inventory_unit else None,
        payment_amount=c.payment_amount,
        payment_date=c.payment_date,
        payment_method=c.payment_method,
        transaction_reference=c.transaction_reference,
        payment_type=c.payment_type,
        is_reversed=c.is_reversed,
        reversed_collection_id=c.reversed_collection_id,
        notes=c.notes,
        recorded_by_id=c.recorded_by_id,
        recorded_by_name=c.recorded_by.full_name if c.recorded_by else None,
        created_at=c.created_at,
    )


def list_collections(
    db: Session,
    search: Optional[str] = None,
    customer_id: Optional[uuid.UUID] = None,
    booking_id: Optional[uuid.UUID] = None,
    payment_method: Optional[str] = None,
    payment_type: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    page: int = 1,
    page_size: int = 20,
):
    query = db.query(Collection).options(
        joinedload(Collection.booking).joinedload(Booking.project),
        joinedload(Collection.booking).joinedload(Booking.inventory_unit),
        joinedload(Collection.customer),
        joinedload(Collection.recorded_by),
    )

    if customer_id:
        query = query.filter(Collection.customer_id == customer_id)
    if booking_id:
        query = query.filter(Collection.booking_id == booking_id)
    if payment_method:
        query = query.filter(Collection.payment_method == payment_method)
    if payment_type:
        query = query.filter(Collection.payment_type == payment_type)
    if start_date:
        query = query.filter(Collection.payment_date >= start_date)
    if end_date:
        query = query.filter(Collection.payment_date <= end_date)
    if search:
        term = f"%{search.strip()}%"
        query = query.join(Collection.customer).join(Collection.booking).filter(
            or_(
                Collection.collection_reference.ilike(term),
                Collection.transaction_reference.ilike(term),
                Customer.full_name.ilike(term),
                Booking.booking_reference.ilike(term),
            )
        )

    total = query.count()
    safe_page, total_pages = calculate_pagination(total, page, page_size)
    rows = (
        query.order_by(Collection.payment_date.desc(), Collection.created_at.desc())
        .offset((safe_page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return {
        "items": [_to_collection_read(c) for c in rows],
        "total": total,
        "page": safe_page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


def get_collection(db: Session, collection_id: uuid.UUID) -> CollectionRead:
    col = (
        db.query(Collection)
        .options(
            joinedload(Collection.booking).joinedload(Booking.project),
            joinedload(Collection.booking).joinedload(Booking.inventory_unit),
            joinedload(Collection.customer),
            joinedload(Collection.recorded_by),
        )
        .filter(Collection.id == collection_id)
        .first()
    )
    if not col:
        raise NotFoundError("Collection entry not found.")
    return _to_collection_read(col)


def get_collection_summary(
    db: Session,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    project_id: Optional[uuid.UUID] = None,
) -> CollectionSummary:
    col_query = db.query(Collection).join(Collection.booking)
    if start_date:
        col_query = col_query.filter(Collection.payment_date >= start_date)
    if end_date:
        col_query = col_query.filter(Collection.payment_date <= end_date)
    if project_id:
        col_query = col_query.filter(Booking.project_id == project_id)

    entries = col_query.all()
    total_collected = sum(
        (
            Decimal(c.payment_amount)
            for c in entries
            if not c.is_reversed
            and c.payment_type in ("Booking Payment", "Partial Payment", "Other Payment")
        ),
        Decimal("0.00"),
    )
    total_refunded = sum(
        (
            Decimal(c.payment_amount)
            for c in entries
            if not c.is_reversed and c.payment_type == "Refund"
        ),
        Decimal("0.00"),
    )
    net_collected = total_collected - total_refunded

    # Calculate active booking total and outstanding balance using backend ledger math
    booking_query = db.query(Booking).options(joinedload(Booking.collections)).filter(Booking.status != "Cancelled")
    if project_id:
        booking_query = booking_query.filter(Booking.project_id == project_id)
    active_bookings = booking_query.all()

    total_agreed = sum((Decimal(b.final_agreed_price) for b in active_bookings), Decimal("0.00"))
    total_outstanding = sum(
        (compute_booking_financials(b)[2] for b in active_bookings),
        Decimal("0.00"),
    )

    return CollectionSummary(
        total_collected=total_collected,
        total_refunded=total_refunded,
        net_collected=net_collected,
        total_agreed_active_bookings=total_agreed,
        total_outstanding_balance=total_outstanding,
        entry_count=len(entries),
    )


def record_collection(
    db: Session,
    payload: CollectionCreate,
    actor: Employee,
    ip_address: Optional[str] = None,
) -> CollectionRead:
    booking = (
        db.query(Booking)
        .options(joinedload(Booking.collections))
        .filter(Booking.id == payload.booking_id)
        .first()
    )
    if not booking:
        raise NotFoundError("Booking not found.")

    amount = Decimal(payload.payment_amount)
    if amount <= Decimal("0.00"):
        raise BusinessRuleError("Payment amount must be positive.")

    total_collected, total_refunded, outstanding = compute_booking_financials(booking)
    net_collected = total_collected - total_refunded

    if payload.payment_type == "Refund":
        if amount > net_collected:
            raise BusinessRuleError(
                f"Refund amount ({amount}) cannot exceed net collected amount ({net_collected})."
            )
    else:
        if booking.status == "Cancelled":
            raise BusinessRuleError("Cannot record a normal payment against a cancelled booking.")
        if amount > outstanding:
            perms = get_employee_permissions(actor)
            if not (payload.allow_overpayment and ("collections:reverse" in perms or actor.is_superuser)):
                raise BusinessRuleError(
                    f"Payment amount ({amount}) exceeds outstanding booking balance ({outstanding})."
                )

    entry = Collection(
        collection_reference=generate_reference("COL"),
        booking_id=booking.id,
        customer_id=booking.customer_id,
        payment_amount=amount,
        payment_date=payload.payment_date or date.today(),
        payment_method=payload.payment_method,
        transaction_reference=payload.transaction_reference,
        payment_type=payload.payment_type,
        notes=payload.notes,
        recorded_by_id=actor.id,
    )
    db.add(entry)
    db.flush()

    record_activity(
        db,
        employee_id=actor.id,
        action="COLLECTION_RECORDED" if payload.payment_type != "Refund" else "REFUND_RECORDED",
        entity_type="collection",
        entity_id=entry.id,
        metadata={
            "collection_reference": entry.collection_reference,
            "booking_reference": booking.booking_reference,
            "amount": str(amount),
            "payment_type": payload.payment_type,
        },
        ip_address=ip_address,
    )
    db.commit()
    return get_collection(db, entry.id)


def reverse_collection(
    db: Session,
    collection_id: uuid.UUID,
    reason: str,
    actor: Employee,
    ip_address: Optional[str] = None,
) -> CollectionRead:
    original = db.query(Collection).filter(Collection.id == collection_id).first()
    if not original:
        raise NotFoundError("Collection entry not found.")
    if original.is_reversed:
        raise BusinessRuleError("This collection entry has already been reversed.")
    if original.payment_type == "Reversal":
        raise BusinessRuleError("Cannot reverse a reversal entry.")

    original.is_reversed = True
    reversal = Collection(
        collection_reference=generate_reference("REV"),
        booking_id=original.booking_id,
        customer_id=original.customer_id,
        payment_amount=-Decimal(original.payment_amount),
        payment_date=date.today(),
        payment_method=original.payment_method,
        transaction_reference=original.transaction_reference,
        payment_type="Reversal",
        is_reversed=False,
        reversed_collection_id=original.id,
        notes=f"Reversal of {original.collection_reference}: {reason.strip()}",
        recorded_by_id=actor.id,
    )
    db.add(reversal)
    db.flush()

    record_activity(
        db,
        employee_id=actor.id,
        action="COLLECTION_REVERSED",
        entity_type="collection",
        entity_id=original.id,
        metadata={
            "original_reference": original.collection_reference,
            "reversal_reference": reversal.collection_reference,
            "reason": reason.strip(),
        },
        ip_address=ip_address,
    )
    db.commit()
    return get_collection(db, reversal.id)
