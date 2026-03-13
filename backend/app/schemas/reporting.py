from __future__ import annotations

from datetime import date, datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.enums import ComplianceStatus, EmploymentStatus, PickupStatus, VerificationStatus
from app.schemas.bulk_generator import BulkWasteGeneratorRead
from app.schemas.carbon_event import CarbonEventRead
from app.schemas.carbon_ledger_entry import CarbonLedgerEntryRead
from app.schemas.carbon_verification import CarbonVerificationRead
from app.schemas.collected_batch import CollectedBatchRead
from app.schemas.environmental_summary import EnvironmentalSummaryRead
from app.schemas.facility_receipt import FacilityReceiptRead
from app.schemas.landfill_record import LandfillRecordRead
from app.schemas.pickup_task import PickupTaskRead
from app.schemas.processing_facility import ProcessingFacilityRead
from app.schemas.processing_record import ProcessingRecordRead
from app.schemas.recovery_certificate import RecoveryCertificateRead
from app.schemas.transfer_record import TransferRecordRead


class DashboardMetricBundle(BaseModel):
    total_households: int = 0
    total_bulk_generators: int = 0
    total_active_workers: int = 0
    total_pickup_tasks: int = 0
    completed_pickups: int = 0
    missed_pickups: int = 0
    total_collected_weight_kg: float = 0.0
    total_processed_weight_kg: float = 0.0
    total_landfilled_weight_kg: float = 0.0
    landfill_diversion_percent: float = 0.0
    avoided_emissions_kgco2e: float = 0.0
    net_emissions_kgco2e: float = 0.0


class CityOverviewResponse(BaseModel):
    city_id: UUID
    date_from: date | None = None
    date_to: date | None = None
    metrics: DashboardMetricBundle


class WardOverviewResponse(BaseModel):
    city_id: UUID
    ward_id: UUID
    date_from: date | None = None
    date_to: date | None = None
    metrics: DashboardMetricBundle


class WardComparisonRow(BaseModel):
    ward_id: UUID
    ward_name: str
    metrics: DashboardMetricBundle


class CityWardComparisonResponse(BaseModel):
    city_id: UUID
    date_from: date | None = None
    date_to: date | None = None
    city_summary: DashboardMetricBundle
    wards: list[WardComparisonRow]


class ReportPageMeta(BaseModel):
    total_count: int
    limit: int
    offset: int
    applied_filters: dict[str, Any]


class PickupReportRow(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    city_id: UUID
    ward_id: UUID
    zone_id: UUID | None = None
    route_id: UUID | None = None
    assigned_worker_id: UUID | None = None
    source_type: str
    household_id: UUID | None = None
    bulk_generator_id: UUID | None = None
    scheduled_date: date
    pickup_status: PickupStatus
    actual_weight_kg: float | None = None
    contamination_flag: bool


class PickupReportSummary(BaseModel):
    total_tasks: int = 0
    completed_tasks: int = 0
    missed_tasks: int = 0
    total_actual_weight_kg: float = 0.0


class PickupReportPage(BaseModel):
    meta: ReportPageMeta
    summary: PickupReportSummary
    rows: list[PickupReportRow]


class WorkerReportRow(BaseModel):
    worker_id: UUID
    user_id: UUID
    full_name: str
    employee_code: str
    city_id: UUID
    ward_id: UUID | None = None
    zone_id: UUID | None = None
    employment_status: EmploymentStatus
    is_active: bool
    assigned_tasks: int = 0
    completed_tasks: int = 0
    missed_tasks: int = 0
    completed_weight_kg: float = 0.0


class WorkerReportSummary(BaseModel):
    total_workers: int = 0
    active_workers: int = 0
    total_assigned_tasks: int = 0
    total_completed_tasks: int = 0
    total_completed_weight_kg: float = 0.0


class WorkerReportPage(BaseModel):
    meta: ReportPageMeta
    summary: WorkerReportSummary
    rows: list[WorkerReportRow]


class RouteReportRow(BaseModel):
    route_id: UUID
    route_code: str
    route_name: str
    city_id: UUID
    ward_id: UUID
    zone_id: UUID | None = None
    total_stops: int = 0
    total_tasks: int = 0
    completed_tasks: int = 0
    missed_tasks: int = 0
    completed_weight_kg: float = 0.0


class RouteReportSummary(BaseModel):
    total_routes: int = 0
    total_tasks: int = 0
    total_completed_tasks: int = 0
    total_completed_weight_kg: float = 0.0


class RouteReportPage(BaseModel):
    meta: ReportPageMeta
    summary: RouteReportSummary
    rows: list[RouteReportRow]


class FacilityReportRow(BaseModel):
    facility_id: UUID
    facility_code: str
    name: str
    city_id: UUID
    ward_id: UUID | None = None
    zone_id: UUID | None = None
    is_active: bool
    total_transfers: int = 0
    total_processed_weight_kg: float = 0.0
    total_landfilled_weight_kg: float = 0.0
    total_certificates: int = 0
    certified_weight_kg: float = 0.0


class FacilityReportSummary(BaseModel):
    total_facilities: int = 0
    total_transfers: int = 0
    total_processed_weight_kg: float = 0.0
    total_landfilled_weight_kg: float = 0.0
    total_certificates: int = 0


class FacilityReportPage(BaseModel):
    meta: ReportPageMeta
    summary: FacilityReportSummary
    rows: list[FacilityReportRow]


class TransferReportRow(BaseModel):
    transfer_id: UUID
    batch_id: UUID
    to_facility_id: UUID
    city_id: UUID
    ward_id: UUID
    transfer_status: str
    dispatched_at: datetime
    received_at: datetime | None = None
    dispatched_weight_kg: float
    received_weight_kg: float | None = None


class TransferReportSummary(BaseModel):
    total_transfers: int = 0
    received_transfers: int = 0
    total_dispatched_weight_kg: float = 0.0
    total_received_weight_kg: float = 0.0


class TransferReportPage(BaseModel):
    meta: ReportPageMeta
    summary: TransferReportSummary
    rows: list[TransferReportRow]


class BulkGeneratorReportRow(BaseModel):
    generator_id: UUID
    generator_code: str
    entity_name: str
    city_id: UUID
    ward_id: UUID
    zone_id: UUID | None = None
    generator_type: str
    compliance_status: ComplianceStatus
    onboarding_status: str
    is_active: bool
    total_pickups: int = 0
    completed_pickups: int = 0
    missed_pickups: int = 0
    total_picked_weight_kg: float = 0.0
    total_certificates: int = 0
    certified_weight_kg: float = 0.0


class BulkGeneratorReportSummary(BaseModel):
    total_generators: int = 0
    compliant_generators: int = 0
    non_compliant_generators: int = 0
    total_pickups: int = 0
    total_certificates: int = 0
    total_certified_weight_kg: float = 0.0


class BulkGeneratorReportPage(BaseModel):
    meta: ReportPageMeta
    summary: BulkGeneratorReportSummary
    rows: list[BulkGeneratorReportRow]


class EnvironmentalSummaryReportRow(BaseModel):
    summary_id: UUID
    city_id: UUID
    ward_id: UUID | None = None
    reporting_month: int
    reporting_year: int
    summary_status: str
    total_collected_kg: float | None = None
    total_processed_kg: float | None = None
    total_landfilled_kg: float | None = None
    landfill_diversion_percent: float | None = None
    avoided_emission_kgco2e: float | None = None
    net_emission_kgco2e: float | None = None
    generated_at: datetime


class EnvironmentalSummaryReportSummary(BaseModel):
    total_summaries: int = 0
    collected_kg: float = 0.0
    processed_kg: float = 0.0
    landfilled_kg: float = 0.0
    avoided_emission_kgco2e: float = 0.0
    net_emission_kgco2e: float = 0.0


class EnvironmentalSummaryReportPage(BaseModel):
    meta: ReportPageMeta
    summary: EnvironmentalSummaryReportSummary
    rows: list[EnvironmentalSummaryReportRow]


class CarbonLedgerReportRow(BaseModel):
    entry_id: UUID
    carbon_event_id: UUID
    city_id: UUID | None = None
    ward_id: UUID | None = None
    entry_type: str
    verification_status: VerificationStatus
    period_month: int | None = None
    period_year: int | None = None
    quantity_kgco2e: float
    recorded_at: datetime


class CarbonLedgerReportSummary(BaseModel):
    total_entries: int = 0
    verified_entries: int = 0
    rejected_entries: int = 0
    total_quantity_kgco2e: float = 0.0


class CarbonLedgerReportPage(BaseModel):
    meta: ReportPageMeta
    summary: CarbonLedgerReportSummary
    rows: list[CarbonLedgerReportRow]


class GeneratorProfileSummary(BaseModel):
    generator_id: UUID
    generator_code: str
    entity_name: str
    city_id: UUID
    ward_id: UUID
    zone_id: UUID | None = None
    generator_type: str
    estimated_daily_waste_kg: float | None = None
    compliance_status: ComplianceStatus
    onboarding_status: str
    is_active: bool


class PickupHistorySummary(BaseModel):
    total_pickups: int = 0
    completed_pickups: int = 0
    missed_pickups: int = 0
    completion_rate_percent: float = 0.0
    total_collected_weight_kg: float = 0.0
    latest_pickup_date: date | None = None


class CertificateRecoverySummary(BaseModel):
    total_certificates: int = 0
    verified_certificates: int = 0
    rejected_certificates: int = 0
    total_certified_weight_kg: float = 0.0
    total_recovered_weight_kg: float = 0.0
    latest_certificate_date: date | None = None


class ComplianceStatusView(BaseModel):
    current_status: ComplianceStatus
    verification_coverage_percent: float = 0.0
    recommended_action: str


class BulkGeneratorComplianceSummaryResponse(BaseModel):
    profile: GeneratorProfileSummary
    pickup_history: PickupHistorySummary
    certificate_recovery: CertificateRecoverySummary
    compliance_status_view: ComplianceStatusView


class BulkGeneratorProfileReportResponse(BaseModel):
    profile: GeneratorProfileSummary
    pickup_history: PickupHistorySummary
    certificate_recovery: CertificateRecoverySummary


class BatchLifecycleAuditExport(BaseModel):
    batch: CollectedBatchRead
    transfers: list[TransferRecordRead]
    facility_receipts: list[FacilityReceiptRead]
    processing_records: list[ProcessingRecordRead]
    landfill_records: list[LandfillRecordRead]
    recovery_certificates: list[RecoveryCertificateRead]
    carbon_events: list[CarbonEventRead]
    carbon_ledger_entries: list[CarbonLedgerEntryRead]
    generated_at: datetime


class BulkGeneratorLifecycleAuditExport(BaseModel):
    generator: BulkWasteGeneratorRead
    pickup_tasks: list[PickupTaskRead]
    recovery_certificates: list[RecoveryCertificateRead]
    carbon_events: list[CarbonEventRead]
    carbon_ledger_entries: list[CarbonLedgerEntryRead]
    generated_at: datetime


class CarbonEventLifecycleAuditExport(BaseModel):
    carbon_event: CarbonEventRead
    batch: CollectedBatchRead | None = None
    facility: ProcessingFacilityRead | None = None
    processing_record: ProcessingRecordRead | None = None
    landfill_record: LandfillRecordRead | None = None
    recovery_certificate: RecoveryCertificateRead | None = None
    ledger_entries: list[CarbonLedgerEntryRead]
    verifications: list[CarbonVerificationRead]
    related_environmental_summaries: list[EnvironmentalSummaryRead]
    generated_at: datetime
