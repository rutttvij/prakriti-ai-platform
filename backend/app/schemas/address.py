from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class AddressCreate(BaseModel):
    address_line_1: str = Field(min_length=2, max_length=255)
    address_line_2: str | None = Field(default=None, max_length=255)
    landmark: str | None = Field(default=None, max_length=255)
    area: str = Field(min_length=2, max_length=150)
    city_name: str = Field(min_length=2, max_length=120)
    state: str = Field(min_length=2, max_length=120)
    country: str = Field(min_length=2, max_length=120)
    postal_code: str = Field(min_length=2, max_length=20)
    latitude: Decimal | None = None
    longitude: Decimal | None = None
    is_active: bool = True


class AddressUpdate(BaseModel):
    address_line_1: str | None = Field(default=None, min_length=2, max_length=255)
    address_line_2: str | None = Field(default=None, max_length=255)
    landmark: str | None = Field(default=None, max_length=255)
    area: str | None = Field(default=None, min_length=2, max_length=150)
    city_name: str | None = Field(default=None, min_length=2, max_length=120)
    state: str | None = Field(default=None, min_length=2, max_length=120)
    country: str | None = Field(default=None, min_length=2, max_length=120)
    postal_code: str | None = Field(default=None, min_length=2, max_length=20)
    latitude: Decimal | None = None
    longitude: Decimal | None = None
    is_active: bool | None = None


class AddressRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    address_line_1: str
    address_line_2: str | None
    landmark: str | None
    area: str
    city_name: str
    state: str
    country: str
    postal_code: str
    latitude: Decimal | None
    longitude: Decimal | None
    is_active: bool
    created_at: datetime
    updated_at: datetime
