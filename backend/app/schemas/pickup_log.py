from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import PickupEventType


class PickupLogCreate(BaseModel):
    pickup_task_id: UUID
    worker_profile_id: UUID
    event_type: PickupEventType
    latitude: Decimal | None = None
    longitude: Decimal | None = None
    event_at: datetime | None = None
    notes: str | None = Field(default=None, max_length=1000)
    weight_kg: float | None = Field(default=None, ge=0)
    photo_url: str | None = Field(default=None, max_length=1000)


class PickupLogRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    pickup_task_id: UUID
    worker_profile_id: UUID
    event_type: PickupEventType
    latitude: Decimal | None
    longitude: Decimal | None
    event_at: datetime
    notes: str | None
    weight_kg: float | None
    photo_url: str | None
    created_at: datetime
    updated_at: datetime


class PickupLogListItem(PickupLogRead):
    pass
