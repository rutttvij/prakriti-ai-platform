from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import RecoveryMethod, VerificationStatus, WasteType


class RecoveryCertificateCreate(BaseModel):
    certificate_number: str = Field(min_length=2, max_length=120)
    facility_id: UUID
    batch_id: UUID
    bulk_generator_id: UUID | None = None
    issue_date: date
    waste_type: WasteType
    certified_weight_kg: float = Field(gt=0)
    recovery_method: RecoveryMethod
    issued_by_user_id: UUID | None = None
    verification_status: VerificationStatus = VerificationStatus.PENDING
    certificate_url: str | None = Field(default=None, max_length=1000)
    notes: str | None = Field(default=None, max_length=1000)


class RecoveryCertificateRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    certificate_number: str
    facility_id: UUID
    batch_id: UUID
    bulk_generator_id: UUID | None
    issue_date: date
    waste_type: WasteType
    certified_weight_kg: float
    recovery_method: RecoveryMethod
    issued_by_user_id: UUID | None
    verification_status: VerificationStatus
    certificate_url: str | None
    notes: str | None
    created_at: datetime
    updated_at: datetime


class RecoveryCertificateListItem(RecoveryCertificateRead):
    pass
