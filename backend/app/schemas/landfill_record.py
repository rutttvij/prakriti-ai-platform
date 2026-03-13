from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import DisposalMethod


class LandfillRecordCreate(BaseModel):
    facility_id: UUID
    batch_id: UUID | None = None
    disposal_date: date
    waste_weight_kg: float = Field(gt=0)
    disposal_method: DisposalMethod
    landfill_cell: str | None = Field(default=None, max_length=120)
    transported_by_vehicle_id: UUID | None = None
    notes: str | None = Field(default=None, max_length=1000)


class LandfillRecordRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    facility_id: UUID
    batch_id: UUID | None
    disposal_date: date
    waste_weight_kg: float
    disposal_method: DisposalMethod
    landfill_cell: str | None
    transported_by_vehicle_id: UUID | None
    notes: str | None
    created_at: datetime
    updated_at: datetime


class LandfillRecordListItem(LandfillRecordRead):
    pass
