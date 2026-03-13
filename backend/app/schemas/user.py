from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.schemas.role import RoleRead


class UserCreate(BaseModel):
    organization_id: UUID | None = None
    city_id: UUID | None = None
    ward_id: UUID | None = None
    zone_id: UUID | None = None
    full_name: str = Field(min_length=2, max_length=200)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=30)
    password: str = Field(min_length=8, max_length=128)
    is_superuser: bool = False
    is_active: bool = True
    is_verified: bool = False
    role_codes: list[str] = Field(default_factory=list)


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    organization_id: UUID | None
    city_id: UUID | None
    ward_id: UUID | None
    zone_id: UUID | None
    full_name: str
    email: EmailStr
    phone: str | None
    is_superuser: bool
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: datetime
    roles: list[RoleRead] = Field(default_factory=list)
