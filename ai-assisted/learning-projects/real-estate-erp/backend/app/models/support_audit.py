from datetime import datetime
from typing import Any, Dict, List, Optional
import uuid
from sqlalchemy import JSON, DateTime, ForeignKey, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin, utcnow


class Complaint(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "complaints"

    complaint_reference: Mapped[str] = mapped_column(String(40), unique=True, nullable=False, index=True)
    customer_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("customers.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("projects.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    inventory_unit_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("inventory_units.id", ondelete="SET NULL"), nullable=True
    )
    subject: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    priority: Mapped[str] = mapped_column(String(30), default="Medium", nullable=False, index=True)
    assigned_employee_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("employees.id", ondelete="SET NULL"), nullable=True, index=True
    )
    status: Mapped[str] = mapped_column(String(30), default="Open", nullable=False, index=True)
    resolution_details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("employees.id", ondelete="RESTRICT"), nullable=False
    )

    customer = relationship("Customer", foreign_keys=[customer_id])
    project = relationship("Project", foreign_keys=[project_id])
    inventory_unit = relationship("InventoryUnit", foreign_keys=[inventory_unit_id])
    assigned_employee = relationship("Employee", foreign_keys=[assigned_employee_id])
    created_by = relationship("Employee", foreign_keys=[created_by_id])
    history: Mapped[List["ComplaintStatusHistory"]] = relationship(
        "ComplaintStatusHistory", back_populates="complaint", order_by="ComplaintStatusHistory.created_at.desc()"
    )


class ComplaintStatusHistory(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "complaint_status_history"

    complaint_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False, index=True
    )
    previous_status: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    new_status: Mapped[str] = mapped_column(String(30), nullable=False)
    previous_priority: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    new_priority: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    assigned_employee_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("employees.id", ondelete="SET NULL"), nullable=True
    )
    changed_by_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("employees.id", ondelete="RESTRICT"), nullable=False
    )
    note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False, index=True
    )

    complaint: Mapped["Complaint"] = relationship("Complaint", back_populates="history")
    changed_by = relationship("Employee", foreign_keys=[changed_by_id])


class ActivityLog(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "activity_logs"

    employee_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("employees.id", ondelete="SET NULL"), nullable=True, index=True
    )
    action: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    entity_type: Mapped[str] = mapped_column(String(60), nullable=False, index=True)
    entity_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    metadata_json: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False, index=True
    )

    employee = relationship("Employee", foreign_keys=[employee_id])
