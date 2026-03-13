from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import CarbonProjectStatus, CarbonProjectType


class CarbonProjectCreate(BaseModel):
    city_id: UUID
    ward_id: UUID | None = None
    project_code: str = Field(min_length=2, max_length=80)
    name: str = Field(min_length=2, max_length=220)
    project_type: CarbonProjectType
    methodology_name: str = Field(min_length=2, max_length=220)
    methodology_version: str | None = Field(default=None, max_length=120)
    standard_body: str | None = Field(default=None, max_length=120)
    start_date: date
    end_date: date | None = None
    status: CarbonProjectStatus = CarbonProjectStatus.DRAFT
    description: str | None = Field(default=None, max_length=1000)
    is_active: bool = True


class CarbonProjectRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    city_id: UUID
    ward_id: UUID | None
    project_code: str
    name: str
    project_type: CarbonProjectType
    methodology_name: str
    methodology_version: str | None
    standard_body: str | None
    start_date: date
    end_date: date | None
    status: CarbonProjectStatus
    description: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class CarbonProjectListItem(CarbonProjectRead):
    pass
