from datetime import date, datetime
from decimal import Decimal
from typing import Any, Dict, List, Literal, Optional
import uuid
from pydantic import BaseModel, Field

from app.schemas.common import ORMBase

ComplaintPriority = Literal["Low", "Medium", "High", "Critical"]
ComplaintStatus = Literal["Open", "In Progress", "Resolved", "Closed"]


class ComplaintCreate(BaseModel):
    customer_id: uuid.UUID
    project_id: uuid.UUID
    inventory_unit_id: Optional[uuid.UUID] = None
    subject: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=5)
    category: str = Field(..., min_length=2, max_length=80)
    priority: ComplaintPriority = "Medium"
    assigned_employee_id: Optional[uuid.UUID] = None


class ComplaintUpdate(BaseModel):
    priority: Optional[ComplaintPriority] = None
    assigned_employee_id: Optional[uuid.UUID] = None
    status: Optional[ComplaintStatus] = None
    resolution_details: Optional[str] = None
    note: Optional[str] = Field(None, max_length=500)


class ComplaintHistoryRead(ORMBase):
    id: uuid.UUID
    complaint_id: uuid.UUID
    previous_status: Optional[str] = None
    new_status: str
    previous_priority: Optional[str] = None
    new_priority: Optional[str] = None
    assigned_employee_id: Optional[uuid.UUID] = None
    changed_by_id: uuid.UUID
    changed_by_name: Optional[str] = None
    note: Optional[str] = None
    created_at: datetime


class ComplaintRead(ORMBase):
    id: uuid.UUID
    complaint_reference: str
    customer_id: uuid.UUID
    customer_name: Optional[str] = None
    project_id: uuid.UUID
    project_name: Optional[str] = None
    inventory_unit_id: Optional[uuid.UUID] = None
    unit_number: Optional[str] = None
    subject: str
    description: str
    category: str
    priority: str
    assigned_employee_id: Optional[uuid.UUID] = None
    assigned_employee_name: Optional[str] = None
    status: str
    resolution_details: Optional[str] = None
    resolved_at: Optional[datetime] = None
    created_by_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    history: List[ComplaintHistoryRead] = []


class DashboardKPIs(BaseModel):
    total_projects: int
    active_projects: int
    total_units: int
    available_units: int
    reserved_units: int
    booked_units: int
    sold_units: int
    total_customers: int
    total_leads: int
    total_bookings: int
    total_collected_payments: Decimal
    pending_collections: Decimal
    open_complaints: int


class ChartSeriesItem(BaseModel):
    label: str
    value: float = 0
    secondary_value: Optional[float] = None
    available: Optional[int] = None
    reserved: Optional[int] = None
    booked: Optional[int] = None
    sold: Optional[int] = None


class RecentActivityItem(BaseModel):
    id: str
    action: str
    entity_type: str
    entity_id: str
    employee_name: Optional[str] = None
    summary: str
    created_at: datetime


class DashboardResponse(BaseModel):
    kpis: DashboardKPIs
    inventory_distribution: List[ChartSeriesItem]
    monthly_booking_trends: List[ChartSeriesItem]
    monthly_collection_trends: List[ChartSeriesItem]
    project_inventory_overview: List[ChartSeriesItem]
    recent_bookings: List[Dict[str, Any]]
    recent_customers: List[Dict[str, Any]]
    recent_collections: List[Dict[str, Any]]
    recent_complaints: List[Dict[str, Any]]
    recent_activities: List[RecentActivityItem]


class ReportResponse(BaseModel):
    report_type: str
    generated_at: datetime
    summary: Dict[str, Any]
    columns: List[Dict[str, str]]
    rows: List[Dict[str, Any]]
    total: int
    page: int
    page_size: int
    total_pages: int
