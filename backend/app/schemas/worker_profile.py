from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import EmploymentStatus


class WorkerProfileCreate(BaseModel):
    user_id: UUID
    employee_code: str = Field(min_length=2, max_length=120)
    city_id: UUID
    ward_id: UUID | None = None
    zone_id: UUID | None = None
    designation: str = Field(min_length=2, max_length=150)
    employment_status: EmploymentStatus = EmploymentStatus.ACTIVE
    joined_on: date | None = None
    is_active: bool = True


class WorkerProfileRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    employee_code: str
    city_id: UUID
    ward_id: UUID | None
    zone_id: UUID | None
    designation: str
    employment_status: EmploymentStatus
    joined_on: date | None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class WorkerProfileListItem(WorkerProfileRead):
    pass
