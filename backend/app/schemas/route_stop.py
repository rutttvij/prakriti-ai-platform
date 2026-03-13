from datetime import datetime, time
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.enums import OperationalSourceType


class RouteStopCreate(BaseModel):
    route_id: UUID
    stop_sequence: int = Field(ge=1)
    source_type: OperationalSourceType
    household_id: UUID | None = None
    bulk_generator_id: UUID | None = None
    expected_time: time | None = None
    is_active: bool = True

    @model_validator(mode="after")
    def validate_source_fields(self) -> "RouteStopCreate":
        if self.source_type == OperationalSourceType.HOUSEHOLD:
            if self.household_id is None or self.bulk_generator_id is not None:
                raise ValueError("For HOUSEHOLD source_type, household_id is required and bulk_generator_id must be null")
        if self.source_type == OperationalSourceType.BULK_GENERATOR:
            if self.bulk_generator_id is None or self.household_id is not None:
                raise ValueError("For BULK_GENERATOR source_type, bulk_generator_id is required and household_id must be null")
        return self


class RouteStopRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    route_id: UUID
    stop_sequence: int
    source_type: OperationalSourceType
    household_id: UUID | None
    bulk_generator_id: UUID | None
    expected_time: time | None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class RouteStopListItem(RouteStopRead):
    pass
