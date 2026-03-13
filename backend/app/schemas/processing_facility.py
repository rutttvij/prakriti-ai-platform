from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import FacilityType


class ProcessingFacilityCreate(BaseModel):
    city_id: UUID
    ward_id: UUID | None = None
    zone_id: UUID | None = None
    address_id: UUID | None = None
    facility_code: str = Field(min_length=2, max_length=80)
    name: str = Field(min_length=2, max_length=220)
    facility_type: FacilityType
    operator_name: str | None = Field(default=None, max_length=220)
    license_number: str | None = Field(default=None, max_length=120)
    capacity_kg_per_day: float | None = Field(default=None, ge=0)
    is_active: bool = True


class ProcessingFacilityRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    city_id: UUID
    ward_id: UUID | None
    zone_id: UUID | None
    address_id: UUID | None
    facility_code: str
    name: str
    facility_type: FacilityType
    operator_name: str | None
    license_number: str | None
    capacity_kg_per_day: float | None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class ProcessingFacilityListItem(ProcessingFacilityRead):
    pass
