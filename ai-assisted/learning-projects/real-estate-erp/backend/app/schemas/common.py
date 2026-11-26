from datetime import datetime
from typing import Generic, List, Optional, TypeVar
from pydantic import BaseModel, ConfigDict

T = TypeVar("T")


class ORMBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    page_size: int
    total_pages: int


class MessageResponse(BaseModel):
    message: str


class EmployeeBrief(ORMBase):
    id: str
    employee_code: str
    full_name: str
    email: str


class ActivityLogRead(ORMBase):
    id: str
    employee_id: Optional[str] = None
    employee_name: Optional[str] = None
    action: str
    entity_type: str
    entity_id: str
    metadata_json: Optional[dict] = None
    ip_address: Optional[str] = None
    created_at: datetime
