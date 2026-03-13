from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import ProcessType, WasteType


class EmissionFactorCreate(BaseModel):
    factor_code: str = Field(min_length=2, max_length=80)
    factor_name: str = Field(min_length=2, max_length=220)
    waste_type: WasteType
    process_type: ProcessType | None = None
    factor_unit: str = Field(min_length=2, max_length=80)
    factor_value: float = Field(gt=0)
    source_standard: str | None = Field(default=None, max_length=220)
    geography: str | None = Field(default=None, max_length=220)
    effective_from: date
    effective_to: date | None = None
    methodology_reference: str | None = Field(default=None, max_length=500)
    is_active: bool = True


class EmissionFactorRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    factor_code: str
    factor_name: str
    waste_type: WasteType
    process_type: ProcessType | None
    factor_unit: str
    factor_value: float
    source_standard: str | None
    geography: str | None
    effective_from: date
    effective_to: date | None
    methodology_reference: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class EmissionFactorListItem(EmissionFactorRead):
    pass
