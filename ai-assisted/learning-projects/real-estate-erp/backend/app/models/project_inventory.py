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
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    Uuid,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin, utcnow


class Project(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "projects"

    project_code: Mapped[str] = mapped_column(String(30), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(180), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    location: Mapped[str] = mapped_column(String(180), nullable=False, index=True)
    address: Mapped[str] = mapped_column(Text, nullable=False)
    project_type: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    total_land_area: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)
    number_of_buildings: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    expected_completion_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="Planning", nullable=False, index=True)
    image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    created_by_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("employees.id", ondelete="RESTRICT"), nullable=False
    )

    inventory_units: Mapped[List["InventoryUnit"]] = relationship(
        "InventoryUnit", back_populates="project"
    )
    created_by = relationship("Employee", foreign_keys=[created_by_id])


class InventoryUnit(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "inventory_units"
    __table_args__ = (
        UniqueConstraint("project_id", "unit_number", name="uq_project_unit_number"),
        CheckConstraint("base_price >= 0", name="ck_inventory_base_price_non_neg"),
        CheckConstraint("final_selling_price >= 0", name="ck_inventory_final_price_non_neg"),
        CheckConstraint("size_sqft > 0", name="ck_inventory_size_positive"),
    )

    project_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("projects.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    unit_number: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    building_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    floor_number: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    unit_type: Mapped[str] = mapped_column(String(60), nullable=False, index=True)
    bedrooms: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    bathrooms: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    size_sqft: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    facing: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    base_price: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    additional_charges: Mapped[Decimal] = mapped_column(
        Numeric(14, 2), default=Decimal("0.00"), nullable=False
    )
    discount: Mapped[Decimal] = mapped_column(
        Numeric(14, 2), default=Decimal("0.00"), nullable=False
    )
    final_selling_price: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="Available", nullable=False, index=True)

    project: Mapped["Project"] = relationship("Project", back_populates="inventory_units")
    status_history: Mapped[List["InventoryStatusHistory"]] = relationship(
        "InventoryStatusHistory", back_populates="inventory_unit", order_by="InventoryStatusHistory.created_at.desc()"
    )


class InventoryStatusHistory(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "inventory_status_history"

    inventory_unit_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("inventory_units.id", ondelete="CASCADE"), nullable=False, index=True
    )
    previous_status: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    new_status: Mapped[str] = mapped_column(String(30), nullable=False)
    changed_by_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("employees.id", ondelete="RESTRICT"), nullable=False
    )
    booking_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("bookings.id", ondelete="SET NULL"), nullable=True
    )
    reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False, index=True
    )

    inventory_unit: Mapped["InventoryUnit"] = relationship(
        "InventoryUnit", back_populates="status_history"
    )
    changed_by = relationship("Employee", foreign_keys=[changed_by_id])
