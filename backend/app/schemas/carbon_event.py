from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import (
    CarbonCalculationStatus,
    CarbonEventType,
    CarbonSourceEntityType,
    ProcessType,
    WasteType,
)


class CarbonEventCreate(BaseModel):
    carbon_project_id: UUID | None = None
    event_code: str = Field(min_length=2, max_length=100)
    source_entity_type: CarbonSourceEntityType
    source_entity_id: UUID | None = None

    batch_id: UUID | None = None
    facility_id: UUID | None = None
    processing_record_id: UUID | None = None
    landfill_record_id: UUID | None = None
    recovery_certificate_id: UUID | None = None

    event_type: CarbonEventType
    waste_type: WasteType | None = None
    process_type: ProcessType | None = None
    quantity_kg: float | None = Field(default=None, gt=0)

    factor_id: UUID | None = None
    factor_value: float | None = Field(default=None, gt=0)
    gross_emission_kgco2e: float | None = None
    avoided_emission_kgco2e: float | None = None
    net_emission_kgco2e: float | None = None

    event_date: date
    methodology_snapshot: str | None = Field(default=None, max_length=1000)
    calculation_status: CarbonCalculationStatus = CarbonCalculationStatus.PENDING
    notes: str | None = Field(default=None, max_length=1000)


class CarbonEventRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    carbon_project_id: UUID | None
    event_code: str
    source_entity_type: CarbonSourceEntityType
    source_entity_id: UUID | None
    batch_id: UUID | None
    facility_id: UUID | None
    processing_record_id: UUID | None
    landfill_record_id: UUID | None
    recovery_certificate_id: UUID | None
    event_type: CarbonEventType
    waste_type: WasteType
    quantity_kg: float
    factor_id: UUID | None
    factor_value: float | None
    gross_emission_kgco2e: float | None
    avoided_emission_kgco2e: float | None
    net_emission_kgco2e: float | None
    event_date: date
    methodology_snapshot: str | None
    calculation_status: CarbonCalculationStatus
    notes: str | None
    created_at: datetime
    updated_at: datetime


class CarbonEventListItem(CarbonEventRead):
    pass
