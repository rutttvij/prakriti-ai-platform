from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import BatchStatus


class CollectedBatchCreate(BaseModel):
    city_id: UUID
    ward_id: UUID
    zone_id: UUID | None = None
    batch_code: str = Field(min_length=2, max_length=80)
    created_date: date
    source_type_summary: str | None = Field(default=None, max_length=150)
    total_weight_kg: float | None = Field(default=None, ge=0)
    batch_status: BatchStatus = BatchStatus.CREATED
    assigned_vehicle_id: UUID | None = None
    assigned_worker_id: UUID | None = None
    origin_route_id: UUID | None = None
    notes: str | None = Field(default=None, max_length=1000)
    is_active: bool = True


class CollectedBatchRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    city_id: UUID
    ward_id: UUID
    zone_id: UUID | None
    batch_code: str
    created_date: date
    source_type_summary: str | None
    total_weight_kg: float | None
    batch_status: BatchStatus
    assigned_vehicle_id: UUID | None
    assigned_worker_id: UUID | None
    origin_route_id: UUID | None
    notes: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class CollectedBatchListItem(CollectedBatchRead):
    pass
