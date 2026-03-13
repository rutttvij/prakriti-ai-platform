from datetime import date, datetime, time
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.enums import OperationalSourceType, PickupStatus, WasteCategory


class PickupTaskCreate(BaseModel):
    city_id: UUID
    ward_id: UUID
    zone_id: UUID | None = None
    route_id: UUID | None = None
    route_stop_id: UUID | None = None
    shift_id: UUID | None = None
    source_type: OperationalSourceType
    household_id: UUID | None = None
    bulk_generator_id: UUID | None = None
    assigned_worker_id: UUID | None = None
    assigned_vehicle_id: UUID | None = None
    scheduled_date: date
    scheduled_time_window_start: time | None = None
    scheduled_time_window_end: time | None = None
    pickup_status: PickupStatus = PickupStatus.PENDING
    waste_category: WasteCategory | None = None
    expected_weight_kg: float | None = Field(default=None, ge=0)
    actual_weight_kg: float | None = Field(default=None, ge=0)
    contamination_flag: bool = False
    notes: str | None = Field(default=None, max_length=1000)
    proof_photo_url: str | None = Field(default=None, max_length=1000)
    is_active: bool = True

    @model_validator(mode="after")
    def validate_source_fields(self) -> "PickupTaskCreate":
        if self.source_type == OperationalSourceType.HOUSEHOLD:
            if self.household_id is None or self.bulk_generator_id is not None:
                raise ValueError("For HOUSEHOLD source_type, household_id is required and bulk_generator_id must be null")
        if self.source_type == OperationalSourceType.BULK_GENERATOR:
            if self.bulk_generator_id is None or self.household_id is not None:
                raise ValueError("For BULK_GENERATOR source_type, bulk_generator_id is required and household_id must be null")
        return self


class PickupTaskRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    city_id: UUID
    ward_id: UUID
    zone_id: UUID | None
    route_id: UUID | None
    route_stop_id: UUID | None
    shift_id: UUID | None
    source_type: OperationalSourceType
    household_id: UUID | None
    bulk_generator_id: UUID | None
    assigned_worker_id: UUID | None
    assigned_vehicle_id: UUID | None
    scheduled_date: date
    scheduled_time_window_start: time | None
    scheduled_time_window_end: time | None
    actual_start_at: datetime | None
    actual_completed_at: datetime | None
    pickup_status: PickupStatus
    waste_category: WasteCategory | None
    expected_weight_kg: float | None
    actual_weight_kg: float | None
    contamination_flag: bool
    notes: str | None
    proof_photo_url: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class PickupTaskListItem(PickupTaskRead):
    pass


class PickupTaskStartRequest(BaseModel):
    latitude: Decimal | None = None
    longitude: Decimal | None = None
    notes: str | None = Field(default=None, max_length=1000)
    photo_url: str | None = Field(default=None, max_length=1000)


class PickupTaskCompleteRequest(BaseModel):
    actual_weight_kg: float | None = Field(default=None, ge=0)
    waste_category: WasteCategory | None = None
    contamination_flag: bool | None = None
    latitude: Decimal | None = None
    longitude: Decimal | None = None
    notes: str | None = Field(default=None, max_length=1000)
    photo_url: str | None = Field(default=None, max_length=1000)


class PickupTaskMissRequest(BaseModel):
    latitude: Decimal | None = None
    longitude: Decimal | None = None
    notes: str = Field(min_length=1, max_length=1000)
    photo_url: str | None = Field(default=None, max_length=1000)


class PickupTaskActionResponse(BaseModel):
    task: PickupTaskRead
    message: str
