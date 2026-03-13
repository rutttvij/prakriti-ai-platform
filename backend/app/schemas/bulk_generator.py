from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.enums import ComplianceStatus, GeneratorType, OnboardingStatus


class BulkWasteGeneratorCreate(BaseModel):
    organization_id: UUID | None = None
    city_id: UUID
    ward_id: UUID
    zone_id: UUID | None = None
    address_id: UUID | None = None
    qr_tag_id: UUID | None = None
    generator_code: str = Field(min_length=2, max_length=120)
    entity_name: str = Field(min_length=2, max_length=220)
    contact_person_name: str = Field(min_length=2, max_length=200)
    contact_phone: str = Field(min_length=5, max_length=30)
    contact_email: EmailStr | None = None
    generator_type: GeneratorType
    estimated_daily_waste_kg: float | None = Field(default=None, ge=0)
    compliance_status: ComplianceStatus = ComplianceStatus.UNDER_REVIEW
    onboarding_status: OnboardingStatus = OnboardingStatus.PENDING
    is_active: bool = True


class BulkWasteGeneratorRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    organization_id: UUID | None
    city_id: UUID
    ward_id: UUID
    zone_id: UUID | None
    address_id: UUID | None
    qr_tag_id: UUID | None
    generator_code: str
    entity_name: str
    contact_person_name: str
    contact_phone: str
    contact_email: EmailStr | None
    generator_type: GeneratorType
    estimated_daily_waste_kg: float | None
    compliance_status: ComplianceStatus
    onboarding_status: OnboardingStatus
    is_active: bool
    created_at: datetime
    updated_at: datetime


class BulkWasteGeneratorListItem(BulkWasteGeneratorRead):
    pass
