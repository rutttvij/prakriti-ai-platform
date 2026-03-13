from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import ProcessType, ProcessingStatus


class ProcessingRecordCreate(BaseModel):
    facility_id: UUID
    batch_id: UUID
    processed_at: datetime
    process_type: ProcessType
    input_weight_kg: float = Field(gt=0)
    output_recovered_kg: float | None = Field(default=None, ge=0)
    output_rejected_kg: float | None = Field(default=None, ge=0)
    residue_to_landfill_kg: float | None = Field(default=None, ge=0)
    organic_compost_kg: float | None = Field(default=None, ge=0)
    recyclable_plastic_kg: float | None = Field(default=None, ge=0)
    recyclable_metal_kg: float | None = Field(default=None, ge=0)
    recyclable_paper_kg: float | None = Field(default=None, ge=0)
    recyclable_glass_kg: float | None = Field(default=None, ge=0)
    energy_recovered_kwh: float | None = Field(default=None, ge=0)
    processing_status: ProcessingStatus = ProcessingStatus.INITIATED
    notes: str | None = Field(default=None, max_length=1000)


class ProcessingRecordRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    facility_id: UUID
    batch_id: UUID
    processed_at: datetime
    process_type: ProcessType
    input_weight_kg: float
    output_recovered_kg: float | None
    output_rejected_kg: float | None
    residue_to_landfill_kg: float | None
    organic_compost_kg: float | None
    recyclable_plastic_kg: float | None
    recyclable_metal_kg: float | None
    recyclable_paper_kg: float | None
    recyclable_glass_kg: float | None
    energy_recovered_kwh: float | None
    processing_status: ProcessingStatus
    notes: str | None
    created_at: datetime
    updated_at: datetime


class ProcessingRecordListItem(ProcessingRecordRead):
    pass
