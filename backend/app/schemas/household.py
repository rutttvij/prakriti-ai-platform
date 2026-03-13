from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.enums import DwellingType, OnboardingStatus


class HouseholdCreate(BaseModel):
    organization_id: UUID | None = None
    city_id: UUID
    ward_id: UUID
    zone_id: UUID | None = None
    address_id: UUID | None = None
    qr_tag_id: UUID | None = None
    household_code: str = Field(min_length=2, max_length=120)
    household_head_name: str = Field(min_length=2, max_length=200)
    contact_phone: str | None = Field(default=None, max_length=30)
    contact_email: EmailStr | None = None
    number_of_members: int | None = Field(default=None, ge=1)
    dwelling_type: DwellingType | None = None
    onboarding_status: OnboardingStatus = OnboardingStatus.PENDING
    is_active: bool = True


class HouseholdRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    organization_id: UUID | None
    city_id: UUID
    ward_id: UUID
    zone_id: UUID | None
    address_id: UUID | None
    qr_tag_id: UUID | None
    household_code: str
    household_head_name: str
    contact_phone: str | None
    contact_email: EmailStr | None
    number_of_members: int | None
    dwelling_type: DwellingType | None
    onboarding_status: OnboardingStatus
    is_active: bool
    created_at: datetime
    updated_at: datetime


class HouseholdListItem(HouseholdRead):
    pass
