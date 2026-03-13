from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import OwnershipType, VehicleType


class VehicleCreate(BaseModel):
    city_id: UUID
    ward_id: UUID | None = None
    zone_id: UUID | None = None
    registration_number: str = Field(min_length=2, max_length=60)
    vehicle_type: VehicleType
    capacity_kg: float | None = Field(default=None, ge=0)
    ownership_type: OwnershipType
    is_active: bool = True


class VehicleRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    city_id: UUID
    ward_id: UUID | None
    zone_id: UUID | None
    registration_number: str
    vehicle_type: VehicleType
    capacity_kg: float | None
    ownership_type: OwnershipType
    is_active: bool
    created_at: datetime
    updated_at: datetime


class VehicleListItem(VehicleRead):
    pass
