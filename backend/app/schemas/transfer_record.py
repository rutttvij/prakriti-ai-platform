from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import TransferEntityType, TransferStatus, VerificationStatus


class TransferRecordCreate(BaseModel):
    batch_id: UUID
    from_entity_type: TransferEntityType
    from_entity_id: UUID | None = None
    to_facility_id: UUID
    dispatched_at: datetime
    dispatched_weight_kg: float = Field(gt=0)
    manifest_number: str | None = Field(default=None, max_length=120)
    notes: str | None = Field(default=None, max_length=1000)


class TransferRecordRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    batch_id: UUID
    from_entity_type: TransferEntityType
    from_entity_id: UUID | None
    to_facility_id: UUID
    dispatched_at: datetime
    received_at: datetime | None
    dispatched_weight_kg: float
    received_weight_kg: float | None
    transfer_status: TransferStatus
    manifest_number: str | None
    notes: str | None
    created_at: datetime
    updated_at: datetime


class TransferRecordListItem(TransferRecordRead):
    pass


class TransferReceiveRequest(BaseModel):
    received_at: datetime | None = None
    received_weight_kg: float = Field(gt=0)
    notes: str | None = Field(default=None, max_length=1000)
    create_receipt: bool = True
    facility_received_by_user_id: UUID | None = None
    gross_weight_kg: float | None = Field(default=None, ge=0)
    net_weight_kg: float | None = Field(default=None, gt=0)
    contamination_notes: str | None = Field(default=None, max_length=1000)
    verification_status: VerificationStatus = VerificationStatus.PENDING
    proof_document_url: str | None = Field(default=None, max_length=1000)
