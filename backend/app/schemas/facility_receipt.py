from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import VerificationStatus


class FacilityReceiptCreate(BaseModel):
    transfer_record_id: UUID
    facility_id: UUID
    received_by_user_id: UUID | None = None
    received_at: datetime
    gross_weight_kg: float | None = Field(default=None, ge=0)
    net_weight_kg: float = Field(gt=0)
    contamination_notes: str | None = Field(default=None, max_length=1000)
    verification_status: VerificationStatus = VerificationStatus.PENDING
    proof_document_url: str | None = Field(default=None, max_length=1000)
    notes: str | None = Field(default=None, max_length=1000)


class FacilityReceiptRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    transfer_record_id: UUID
    facility_id: UUID
    received_by_user_id: UUID | None
    received_at: datetime
    gross_weight_kg: float | None
    net_weight_kg: float
    contamination_notes: str | None
    verification_status: VerificationStatus
    proof_document_url: str | None
    notes: str | None
    created_at: datetime
    updated_at: datetime


class FacilityReceiptListItem(FacilityReceiptRead):
    pass
