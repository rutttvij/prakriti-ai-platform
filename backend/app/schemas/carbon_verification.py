from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.enums import VerificationStatus


class CarbonVerificationCreate(BaseModel):
    carbon_event_id: UUID | None = None
    ledger_entry_id: UUID | None = None
    verified_by_user_id: UUID | None = None
    verification_status: VerificationStatus = VerificationStatus.PENDING
    verified_at: datetime | None = None
    comments: str | None = Field(default=None, max_length=1000)
    evidence_document_url: str | None = Field(default=None, max_length=1000)
    discrepancy_notes: str | None = Field(default=None, max_length=1000)

    @model_validator(mode="after")
    def validate_targets(self) -> "CarbonVerificationCreate":
        if self.carbon_event_id is None and self.ledger_entry_id is None:
            raise ValueError("At least one of carbon_event_id or ledger_entry_id is required")
        return self


class CarbonVerificationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    carbon_event_id: UUID | None
    ledger_entry_id: UUID | None
    verified_by_user_id: UUID | None
    verification_status: VerificationStatus
    verified_at: datetime | None
    comments: str | None
    evidence_document_url: str | None
    discrepancy_notes: str | None
    created_at: datetime
    updated_at: datetime


class CarbonVerificationListItem(CarbonVerificationRead):
    pass
