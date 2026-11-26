from datetime import date
from decimal import Decimal
from typing import Optional
import uuid
from sqlalchemy import Boolean, Date, ForeignKey, Numeric, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin


class Customer(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "customers"

    customer_code: Mapped[str] = mapped_column(String(30), unique=True, nullable=False, index=True)
    full_name: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    phone: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    nationality: Mapped[Optional[str]] = mapped_column(String(80), nullable=True)
    occupation: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    identification_reference: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    assigned_sales_executive_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("employees.id", ondelete="SET NULL"), nullable=True, index=True
    )
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    created_by_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("employees.id", ondelete="RESTRICT"), nullable=False
    )

    assigned_sales_executive = relationship("Employee", foreign_keys=[assigned_sales_executive_id])
    created_by = relationship("Employee", foreign_keys=[created_by_id])


class Lead(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "leads"

    lead_code: Mapped[str] = mapped_column(String(30), unique=True, nullable=False, index=True)
    customer_name: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    contact_number: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    interested_project_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("projects.id", ondelete="SET NULL"), nullable=True, index=True
    )
    interested_unit_type: Mapped[Optional[str]] = mapped_column(String(60), nullable=True)
    budget_min: Mapped[Optional[Decimal]] = mapped_column(Numeric(14, 2), nullable=True)
    budget_max: Mapped[Optional[Decimal]] = mapped_column(Numeric(14, 2), nullable=True)
    lead_source: Mapped[Optional[str]] = mapped_column(String(80), nullable=True)
    assigned_employee_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("employees.id", ondelete="SET NULL"), nullable=True, index=True
    )
    follow_up_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True, index=True)
    status: Mapped[str] = mapped_column(String(30), default="New", nullable=False, index=True)
    converted_customer_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("customers.id", ondelete="SET NULL"), nullable=True
    )
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_by_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("employees.id", ondelete="RESTRICT"), nullable=False
    )

    interested_project = relationship("Project", foreign_keys=[interested_project_id])
    assigned_employee = relationship("Employee", foreign_keys=[assigned_employee_id])
    converted_customer = relationship("Customer", foreign_keys=[converted_customer_id])
    created_by = relationship("Employee", foreign_keys=[created_by_id])
