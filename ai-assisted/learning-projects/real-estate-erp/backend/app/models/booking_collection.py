from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional
import uuid
from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Numeric,
    String,
    Text,
    Uuid,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin, utcnow


class Booking(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "bookings"
    __table_args__ = (
        CheckConstraint("final_agreed_price >= 0", name="ck_booking_final_price_non_neg"),
        CheckConstraint("initial_booking_amount >= 0", name="ck_booking_initial_amount_non_neg"),
        # Guarantees at database level that no inventory unit can have >1 Pending/Confirmed booking
        Index(
            "uq_active_booking_per_unit",
            "inventory_unit_id",
            unique=True,
            postgresql_where=text("status IN ('Pending', 'Confirmed')"),
            sqlite_where=text("status IN ('Pending', 'Confirmed')"),
        ),
    )

    booking_reference: Mapped[str] = mapped_column(String(40), unique=True, nullable=False, index=True)
    customer_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("customers.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("projects.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    inventory_unit_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("inventory_units.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    assigned_sales_executive_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("employees.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    booking_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    unit_price_at_booking: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    discount: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=Decimal("0.00"), nullable=False)
    final_agreed_price: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    initial_booking_amount: Mapped[Decimal] = mapped_column(
        Numeric(14, 2), default=Decimal("0.00"), nullable=False
    )
    payment_method: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="Pending", nullable=False, index=True)
    cancellation_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    cancelled_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("employees.id", ondelete="SET NULL"), nullable=True
    )
    cancelled_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_by_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("employees.id", ondelete="RESTRICT"), nullable=False
    )

    customer = relationship("Customer", foreign_keys=[customer_id])
    project = relationship("Project", foreign_keys=[project_id])
    inventory_unit = relationship("InventoryUnit", foreign_keys=[inventory_unit_id])
    assigned_sales_executive = relationship("Employee", foreign_keys=[assigned_sales_executive_id])
    cancelled_by = relationship("Employee", foreign_keys=[cancelled_by_id])
    created_by = relationship("Employee", foreign_keys=[created_by_id])
    status_history: Mapped[List["BookingStatusHistory"]] = relationship(
        "BookingStatusHistory", back_populates="booking", order_by="BookingStatusHistory.created_at.desc()"
    )
    collections: Mapped[List["Collection"]] = relationship("Collection", back_populates="booking")


class BookingStatusHistory(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "booking_status_history"

    booking_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False, index=True
    )
    previous_status: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    new_status: Mapped[str] = mapped_column(String(30), nullable=False)
    changed_by_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("employees.id", ondelete="RESTRICT"), nullable=False
    )
    reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False, index=True
    )

    booking: Mapped["Booking"] = relationship("Booking", back_populates="status_history")
    changed_by = relationship("Employee", foreign_keys=[changed_by_id])


class Collection(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "collections"
    __table_args__ = (
        CheckConstraint("payment_amount != 0", name="ck_collection_non_zero_amount"),
    )

    collection_reference: Mapped[str] = mapped_column(String(40), unique=True, nullable=False, index=True)
    booking_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("bookings.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    customer_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("customers.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    payment_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    payment_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    payment_method: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    transaction_reference: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    payment_type: Mapped[str] = mapped_column(String(40), nullable=False, index=True)
    is_reversed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    reversed_collection_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("collections.id", ondelete="RESTRICT"), nullable=True
    )
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    recorded_by_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("employees.id", ondelete="RESTRICT"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False, index=True
    )

    booking: Mapped["Booking"] = relationship("Booking", back_populates="collections")
    customer = relationship("Customer", foreign_keys=[customer_id])
    recorded_by = relationship("Employee", foreign_keys=[recorded_by_id])
    reversed_collection = relationship("Collection", remote_side="Collection.id", uselist=False)
