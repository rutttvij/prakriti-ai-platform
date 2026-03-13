from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class CityCreate(BaseModel):
    organization_id: UUID
    name: str = Field(min_length=2, max_length=200)
    state: str = Field(min_length=2, max_length=120)
    country: str = Field(min_length=2, max_length=120)
    is_active: bool = True


class CityRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    organization_id: UUID
    name: str
    state: str
    country: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
