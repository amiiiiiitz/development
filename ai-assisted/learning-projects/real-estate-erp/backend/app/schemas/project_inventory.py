from datetime import date, datetime
from decimal import Decimal
from typing import List, Literal, Optional
import uuid
from pydantic import BaseModel, Field, model_validator

from app.schemas.common import ORMBase

ProjectStatus = Literal["Planning", "Active", "On Hold", "Completed", "Cancelled"]
UnitType = Literal["Apartment / Flat", "Residential Plot", "Commercial Space", "Office Space", "Shop"]
InventoryStatus = Literal["Available", "Reserved", "Booked", "Sold", "Handover Complete", "Cancelled"]


class ProjectCreate(BaseModel):
    project_code: str = Field(..., min_length=2, max_length=30)
    name: str = Field(..., min_length=2, max_length=180)
    description: Optional[str] = None
    location: str = Field(..., min_length=2, max_length=180)
    address: str = Field(..., min_length=3)
    project_type: str = Field(..., min_length=2, max_length=80)
    total_land_area: Optional[Decimal] = Field(None, ge=0)
    number_of_buildings: Optional[int] = Field(None, ge=0)
    start_date: Optional[date] = None
    expected_completion_date: Optional[date] = None
    status: ProjectStatus = "Planning"
    image_url: Optional[str] = Field(None, max_length=500)


class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=180)
    description: Optional[str] = None
    location: Optional[str] = Field(None, min_length=2, max_length=180)
    address: Optional[str] = Field(None, min_length=3)
    project_type: Optional[str] = Field(None, min_length=2, max_length=80)
    total_land_area: Optional[Decimal] = Field(None, ge=0)
    number_of_buildings: Optional[int] = Field(None, ge=0)
    start_date: Optional[date] = None
    expected_completion_date: Optional[date] = None
    status: Optional[ProjectStatus] = None
    image_url: Optional[str] = Field(None, max_length=500)
    is_archived: Optional[bool] = None


class ProjectStats(BaseModel):
    total_units: int = 0
    available_units: int = 0
    reserved_units: int = 0
    booked_units: int = 0
    sold_units: int = 0
    total_bookings: int = 0
    total_booking_value: Decimal = Decimal("0.00")
    total_collected: Decimal = Decimal("0.00")


class ProjectRead(ORMBase):
    id: uuid.UUID
    project_code: str
    name: str
    description: Optional[str] = None
    location: str
    address: str
    project_type: str
    total_land_area: Optional[Decimal] = None
    number_of_buildings: Optional[int] = None
    start_date: Optional[date] = None
    expected_completion_date: Optional[date] = None
    status: str
    image_url: Optional[str] = None
    is_archived: bool
    created_by_id: uuid.UUID
    created_by_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    stats: Optional[ProjectStats] = None


class InventoryCreate(BaseModel):
    project_id: uuid.UUID
    unit_number: str = Field(..., min_length=1, max_length=50)
    building_name: Optional[str] = Field(None, max_length=100)
    floor_number: Optional[int] = None
    unit_type: UnitType
    bedrooms: Optional[int] = Field(None, ge=0)
    bathrooms: Optional[int] = Field(None, ge=0)
    size_sqft: Decimal = Field(..., gt=0)
    facing: Optional[str] = Field(None, max_length=50)
    base_price: Decimal = Field(..., ge=0)
    additional_charges: Decimal = Field(Decimal("0.00"), ge=0)
    discount: Decimal = Field(Decimal("0.00"), ge=0)
    description: Optional[str] = None

    @model_validator(mode="after")
    def validate_discount(self):
        if self.discount > self.base_price + self.additional_charges:
            raise ValueError("Discount cannot exceed base price plus additional charges.")
        return self


class InventoryUpdate(BaseModel):
    unit_number: Optional[str] = Field(None, min_length=1, max_length=50)
    building_name: Optional[str] = Field(None, max_length=100)
    floor_number: Optional[int] = None
    unit_type: Optional[UnitType] = None
    bedrooms: Optional[int] = Field(None, ge=0)
    bathrooms: Optional[int] = Field(None, ge=0)
    size_sqft: Optional[Decimal] = Field(None, gt=0)
    facing: Optional[str] = Field(None, max_length=50)
    base_price: Optional[Decimal] = Field(None, ge=0)
    additional_charges: Optional[Decimal] = Field(None, ge=0)
    discount: Optional[Decimal] = Field(None, ge=0)
    description: Optional[str] = None


class InventoryStatusChange(BaseModel):
    status: InventoryStatus
    reason: str = Field(..., min_length=3, max_length=500)


class InventoryStatusHistoryRead(ORMBase):
    id: uuid.UUID
    inventory_unit_id: uuid.UUID
    previous_status: Optional[str] = None
    new_status: str
    changed_by_id: uuid.UUID
    changed_by_name: Optional[str] = None
    booking_id: Optional[uuid.UUID] = None
    reason: Optional[str] = None
    created_at: datetime


class InventoryRead(ORMBase):
    id: uuid.UUID
    project_id: uuid.UUID
    project_name: Optional[str] = None
    project_code: Optional[str] = None
    unit_number: str
    building_name: Optional[str] = None
    floor_number: Optional[int] = None
    unit_type: str
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    size_sqft: Decimal
    facing: Optional[str] = None
    base_price: Decimal
    additional_charges: Decimal
    discount: Decimal
    final_selling_price: Decimal
    description: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime
    status_history: List[InventoryStatusHistoryRead] = []
