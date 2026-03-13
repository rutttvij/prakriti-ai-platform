from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import RouteType


class RouteCreate(BaseModel):
    city_id: UUID
    ward_id: UUID
    zone_id: UUID | None = None
    route_code: str = Field(min_length=2, max_length=80)
    name: str = Field(min_length=2, max_length=200)
    route_type: RouteType
    is_active: bool = True


class RouteRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    city_id: UUID
    ward_id: UUID
    zone_id: UUID | None
    route_code: str
    name: str
    route_type: RouteType
    is_active: bool
    created_at: datetime
    updated_at: datetime


class RouteListItem(RouteRead):
    pass
