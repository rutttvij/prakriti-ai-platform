from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import SummaryStatus


class EnvironmentalSummaryGenerateRequest(BaseModel):
    city_id: UUID
    ward_id: UUID | None = None
    reporting_month: int = Field(ge=1, le=12)
    reporting_year: int = Field(ge=2000, le=2100)
    summary_status: SummaryStatus = SummaryStatus.GENERATED


class EnvironmentalSummaryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    city_id: UUID
    ward_id: UUID | None
    reporting_month: int
    reporting_year: int
    total_collected_kg: float | None
    total_processed_kg: float | None
    total_recycled_kg: float | None
    total_composted_kg: float | None
    total_landfilled_kg: float | None
    landfill_diversion_percent: float | None
    gross_emission_kgco2e: float | None
    avoided_emission_kgco2e: float | None
    net_emission_kgco2e: float | None
    summary_status: SummaryStatus
    generated_at: datetime
    created_at: datetime
    updated_at: datetime


class EnvironmentalSummaryListItem(EnvironmentalSummaryRead):
    pass
