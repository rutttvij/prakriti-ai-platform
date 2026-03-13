from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class WardCreate(BaseModel):
    city_id: UUID
    name: str = Field(min_length=2, max_length=200)
    code: str = Field(min_length=1, max_length=50)
    is_active: bool = True


class WardRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    city_id: UUID
    name: str
    code: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
