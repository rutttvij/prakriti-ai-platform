from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import DebitCreditDirection, LedgerEntryType, VerificationStatus


class CarbonLedgerEntryCreate(BaseModel):
    ledger_entry_code: str = Field(min_length=2, max_length=100)
    carbon_event_id: UUID
    entry_type: LedgerEntryType
    debit_credit_direction: DebitCreditDirection
    quantity_kgco2e: float = Field(gt=0)
    city_id: UUID | None = None
    ward_id: UUID | None = None
    period_month: int | None = Field(default=None, ge=1, le=12)
    period_year: int | None = Field(default=None, ge=2000, le=2100)
    verification_status: VerificationStatus = VerificationStatus.PENDING
    remarks: str | None = Field(default=None, max_length=1000)


class CarbonLedgerEntryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    ledger_entry_code: str
    carbon_event_id: UUID
    entry_type: LedgerEntryType
    debit_credit_direction: DebitCreditDirection
    quantity_kgco2e: float
    city_id: UUID | None
    ward_id: UUID | None
    period_month: int | None
    period_year: int | None
    recorded_at: datetime
    verification_status: VerificationStatus
    remarks: str | None
    created_at: datetime
    updated_at: datetime


class CarbonLedgerEntryListItem(CarbonLedgerEntryRead):
    pass
