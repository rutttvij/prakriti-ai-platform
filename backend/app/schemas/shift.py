from datetime import date, datetime, time
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ShiftCreate(BaseModel):
    city_id: UUID
    ward_id: UUID | None = None
    zone_id: UUID | None = None
    name: str = Field(min_length=2, max_length=120)
    shift_date: date
    start_time: time
    end_time: time
    supervisor_user_id: UUID | None = None
    is_active: bool = True


class ShiftRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    city_id: UUID
    ward_id: UUID | None
    zone_id: UUID | None
    name: str
    shift_date: date
    start_time: time
    end_time: time
    supervisor_user_id: UUID | None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class ShiftListItem(ShiftRead):
    pass
