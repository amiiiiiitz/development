from datetime import date, datetime
from decimal import Decimal
from typing import List, Literal, Optional
import uuid
from pydantic import BaseModel, Field

from app.schemas.common import ORMBase

PaymentMethod = Literal["Cash", "Bank Transfer", "Cheque", "Mobile Financial Service", "Other"]
PaymentType = Literal["Booking Payment", "Partial Payment", "Other Payment", "Refund", "Reversal"]


class BookingCreate(BaseModel):
    customer_id: uuid.UUID
    project_id: uuid.UUID
    inventory_unit_id: uuid.UUID
    assigned_sales_executive_id: Optional[uuid.UUID] = None
    booking_date: Optional[date] = None
    discount: Decimal = Field(Decimal("0.00"), ge=0)
    initial_booking_amount: Decimal = Field(Decimal("0.00"), ge=0)
    payment_method: PaymentMethod = "Bank Transfer"
    notes: Optional[str] = None
    confirm_immediately: bool = False


class BookingCancelRequest(BaseModel):
    reason: str = Field(..., min_length=5, max_length=500)


class BookingStatusHistoryRead(ORMBase):
    id: uuid.UUID
    booking_id: uuid.UUID
    previous_status: Optional[str] = None
    new_status: str
    changed_by_id: uuid.UUID
    changed_by_name: Optional[str] = None
    reason: Optional[str] = None
    created_at: datetime


class BookingRead(ORMBase):
    id: uuid.UUID
    booking_reference: str
    customer_id: uuid.UUID
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    project_id: uuid.UUID
    project_name: Optional[str] = None
    inventory_unit_id: uuid.UUID
    unit_number: Optional[str] = None
    unit_type: Optional[str] = None
    assigned_sales_executive_id: uuid.UUID
    assigned_sales_executive_name: Optional[str] = None
    booking_date: date
    unit_price_at_booking: Decimal
    discount: Decimal
    final_agreed_price: Decimal
    initial_booking_amount: Decimal
    payment_method: str
    status: str
    total_collected: Decimal = Decimal("0.00")
    total_refunded: Decimal = Decimal("0.00")
    outstanding_balance: Decimal = Decimal("0.00")
    cancellation_reason: Optional[str] = None
    cancelled_at: Optional[datetime] = None
    notes: Optional[str] = None
    created_by_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    status_history: List[BookingStatusHistoryRead] = []


class CollectionCreate(BaseModel):
    booking_id: uuid.UUID
    payment_amount: Decimal = Field(..., gt=0)
    payment_date: Optional[date] = None
    payment_method: PaymentMethod
    transaction_reference: Optional[str] = Field(None, max_length=120)
    payment_type: Literal["Booking Payment", "Partial Payment", "Other Payment", "Refund"] = "Partial Payment"
    notes: Optional[str] = None
    allow_overpayment: bool = False


class CollectionReversalRequest(BaseModel):
    reason: str = Field(..., min_length=5, max_length=500)


class CollectionRead(ORMBase):
    id: uuid.UUID
    collection_reference: str
    booking_id: uuid.UUID
    booking_reference: Optional[str] = None
    customer_id: uuid.UUID
    customer_name: Optional[str] = None
    project_name: Optional[str] = None
    unit_number: Optional[str] = None
    payment_amount: Decimal
    payment_date: date
    payment_method: str
    transaction_reference: Optional[str] = None
    payment_type: str
    is_reversed: bool
    reversed_collection_id: Optional[uuid.UUID] = None
    notes: Optional[str] = None
    recorded_by_id: uuid.UUID
    recorded_by_name: Optional[str] = None
    created_at: datetime


class CollectionSummary(BaseModel):
    total_collected: Decimal
    total_refunded: Decimal
    net_collected: Decimal
    total_agreed_active_bookings: Decimal
    total_outstanding_balance: Decimal
    entry_count: int
