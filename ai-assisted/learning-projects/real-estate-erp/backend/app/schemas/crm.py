from datetime import date, datetime
from decimal import Decimal
from typing import Literal, Optional
import uuid
from pydantic import BaseModel, EmailStr, Field

from app.schemas.common import ORMBase

LeadStatus = Literal["New", "Contacted", "Interested", "Qualified", "Converted", "Lost"]


class CustomerCreate(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=150)
    phone: str = Field(..., min_length=5, max_length=30)
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    nationality: Optional[str] = Field(None, max_length=80)
    occupation: Optional[str] = Field(None, max_length=120)
    identification_reference: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None
    assigned_sales_executive_id: Optional[uuid.UUID] = None
    confirm_duplicate: bool = False


class CustomerUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=150)
    phone: Optional[str] = Field(None, min_length=5, max_length=30)
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    nationality: Optional[str] = Field(None, max_length=80)
    occupation: Optional[str] = Field(None, max_length=120)
    identification_reference: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None
    assigned_sales_executive_id: Optional[uuid.UUID] = None
    is_archived: Optional[bool] = None


class CustomerRead(ORMBase):
    id: uuid.UUID
    customer_code: str
    full_name: str
    phone: str
    email: Optional[str] = None
    address: Optional[str] = None
    nationality: Optional[str] = None
    occupation: Optional[str] = None
    identification_reference: Optional[str] = None
    notes: Optional[str] = None
    assigned_sales_executive_id: Optional[uuid.UUID] = None
    assigned_sales_executive_name: Optional[str] = None
    is_archived: bool
    created_by_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class LeadCreate(BaseModel):
    customer_name: str = Field(..., min_length=2, max_length=150)
    contact_number: str = Field(..., min_length=5, max_length=30)
    email: Optional[EmailStr] = None
    interested_project_id: Optional[uuid.UUID] = None
    interested_unit_type: Optional[str] = Field(None, max_length=60)
    budget_min: Optional[Decimal] = Field(None, ge=0)
    budget_max: Optional[Decimal] = Field(None, ge=0)
    lead_source: Optional[str] = Field(None, max_length=80)
    assigned_employee_id: Optional[uuid.UUID] = None
    follow_up_date: Optional[date] = None
    status: LeadStatus = "New"
    notes: Optional[str] = None


class LeadUpdate(BaseModel):
    customer_name: Optional[str] = Field(None, min_length=2, max_length=150)
    contact_number: Optional[str] = Field(None, min_length=5, max_length=30)
    email: Optional[EmailStr] = None
    interested_project_id: Optional[uuid.UUID] = None
    interested_unit_type: Optional[str] = Field(None, max_length=60)
    budget_min: Optional[Decimal] = Field(None, ge=0)
    budget_max: Optional[Decimal] = Field(None, ge=0)
    lead_source: Optional[str] = Field(None, max_length=80)
    assigned_employee_id: Optional[uuid.UUID] = None
    follow_up_date: Optional[date] = None
    status: Optional[LeadStatus] = None
    notes: Optional[str] = None


class LeadConvertRequest(BaseModel):
    address: Optional[str] = None
    nationality: Optional[str] = Field(None, max_length=80)
    occupation: Optional[str] = Field(None, max_length=120)
    notes: Optional[str] = None


class LeadRead(ORMBase):
    id: uuid.UUID
    lead_code: str
    customer_name: str
    contact_number: str
    email: Optional[str] = None
    interested_project_id: Optional[uuid.UUID] = None
    interested_project_name: Optional[str] = None
    interested_unit_type: Optional[str] = None
    budget_min: Optional[Decimal] = None
    budget_max: Optional[Decimal] = None
    lead_source: Optional[str] = None
    assigned_employee_id: Optional[uuid.UUID] = None
    assigned_employee_name: Optional[str] = None
    follow_up_date: Optional[date] = None
    status: str
    converted_customer_id: Optional[uuid.UUID] = None
    notes: Optional[str] = None
    created_by_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
