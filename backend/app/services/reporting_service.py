from __future__ import annotations

import csv
import io
from collections.abc import Iterable
from datetime import date, datetime, time
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import Select, case, func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.models.bulk_waste_generator import BulkWasteGenerator
from app.models.carbon_event import CarbonEvent
from app.models.carbon_ledger_entry import CarbonLedgerEntry
from app.models.carbon_verification import CarbonVerification
from app.models.collected_batch import CollectedBatch
from app.models.enums import (
    ComplianceStatus,
    EmploymentStatus,
    LedgerEntryType,
    PickupStatus,
    SummaryStatus,
    TransferStatus,
    VerificationStatus,
)
from app.models.environmental_summary import EnvironmentalSummary
from app.models.facility_receipt import FacilityReceipt
from app.models.household import Household
from app.models.landfill_record import LandfillRecord
from app.models.pickup_task import PickupTask
from app.models.processing_facility import ProcessingFacility
from app.models.processing_record import ProcessingRecord
from app.models.recovery_certificate import RecoveryCertificate
from app.models.route import Route
from app.models.route_stop import RouteStop
from app.models.transfer_record import TransferRecord
from app.models.ward import Ward
from app.models.worker_profile import WorkerProfile
from app.models.user import User
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
from app.schemas.reporting import (
    BatchLifecycleAuditExport,
    BulkGeneratorComplianceSummaryResponse,
    BulkGeneratorLifecycleAuditExport,
    BulkGeneratorProfileReportResponse,
    BulkGeneratorReportPage,
    BulkGeneratorReportRow,
    BulkGeneratorReportSummary,
    CarbonEventLifecycleAuditExport,
    CarbonLedgerReportPage,
    CarbonLedgerReportRow,
    CarbonLedgerReportSummary,
    CityOverviewResponse,
    CityWardComparisonResponse,
    ComplianceStatusView,
    DashboardMetricBundle,
    EnvironmentalSummaryReportPage,
    EnvironmentalSummaryReportRow,
    EnvironmentalSummaryReportSummary,
    FacilityReportPage,
    FacilityReportRow,
    FacilityReportSummary,
    GeneratorProfileSummary,
    PickupHistorySummary,
    PickupReportPage,
    PickupReportRow,
    PickupReportSummary,
    ReportPageMeta,
    RouteReportPage,
    RouteReportRow,
    RouteReportSummary,
    TransferReportPage,
    TransferReportRow,
    TransferReportSummary,
    WardComparisonRow,
    WardOverviewResponse,
    WorkerReportPage,
    WorkerReportRow,
    WorkerReportSummary,
    CertificateRecoverySummary,
)
from app.schemas.transfer_record import TransferRecordRead
from app.services.carbon_accounting_common import derive_scope_from_carbon_event


MAX_LIMIT = 500


def _normalize_limit_offset(limit: int, offset: int) -> tuple[int, int]:
    safe_limit = max(1, min(MAX_LIMIT, limit))
    safe_offset = max(0, offset)
    return safe_limit, safe_offset


def _coalesce_float(value: float | int | None) -> float:
    return float(value or 0.0)


def _to_filter_dict(**kwargs):
    cleaned: dict[str, str | int | float | bool | None] = {}
    for key, value in kwargs.items():
        if value is None:
            continue
        if isinstance(value, UUID):
            cleaned[key] = str(value)
        elif isinstance(value, (date, datetime)):
            cleaned[key] = value.isoformat()
        elif hasattr(value, "value"):
            cleaned[key] = value.value
        else:
            cleaned[key] = value
    return cleaned


def _build_meta(total_count: int, limit: int, offset: int, **filters) -> ReportPageMeta:
    return ReportPageMeta(
        total_count=total_count,
        limit=limit,
        offset=offset,
        applied_filters=_to_filter_dict(**filters),
    )


def _apply_pickup_date_filters(query: Select, date_column, date_from: date | None, date_to: date | None) -> Select:
    if date_from:
        query = query.where(date_column >= date_from)
    if date_to:
        query = query.where(date_column <= date_to)
    return query


def _apply_datetime_date_filters(query: Select, datetime_column, date_from: date | None, date_to: date | None) -> Select:
    if date_from:
        start_dt = datetime.combine(date_from, time.min)
        query = query.where(datetime_column >= start_dt)
    if date_to:
        end_dt = datetime.combine(date_to, time.max)
        query = query.where(datetime_column <= end_dt)
    return query


def _aggregate_dashboard_metrics(
    db: Session,
    city_id: UUID,
    ward_id: UUID | None = None,
    zone_id: UUID | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
) -> DashboardMetricBundle:
    households_query = select(func.count(Household.id)).where(Household.city_id == city_id, Household.is_active.is_(True))
    generators_query = select(func.count(BulkWasteGenerator.id)).where(
        BulkWasteGenerator.city_id == city_id,
        BulkWasteGenerator.is_active.is_(True),
    )
    workers_query = select(func.count(WorkerProfile.id)).where(
        WorkerProfile.city_id == city_id,
        WorkerProfile.is_active.is_(True),
        WorkerProfile.employment_status == EmploymentStatus.ACTIVE,
    )
    pickups_query = select(
        func.count(PickupTask.id),
        func.coalesce(func.sum(case((PickupTask.pickup_status == PickupStatus.COMPLETED, 1), else_=0)), 0),
        func.coalesce(func.sum(case((PickupTask.pickup_status == PickupStatus.MISSED, 1), else_=0)), 0),
    ).where(PickupTask.city_id == city_id)

    batch_weight_query = select(func.coalesce(func.sum(CollectedBatch.total_weight_kg), 0.0)).where(CollectedBatch.city_id == city_id)
    processed_weight_query = (
        select(func.coalesce(func.sum(ProcessingRecord.input_weight_kg), 0.0))
        .join(CollectedBatch, CollectedBatch.id == ProcessingRecord.batch_id)
        .where(CollectedBatch.city_id == city_id)
    )
    landfill_weight_query = (
        select(func.coalesce(func.sum(LandfillRecord.waste_weight_kg), 0.0))
        .join(ProcessingFacility, ProcessingFacility.id == LandfillRecord.facility_id)
        .where(ProcessingFacility.city_id == city_id)
    )

    if ward_id:
        households_query = households_query.where(Household.ward_id == ward_id)
        generators_query = generators_query.where(BulkWasteGenerator.ward_id == ward_id)
        workers_query = workers_query.where(WorkerProfile.ward_id == ward_id)
        pickups_query = pickups_query.where(PickupTask.ward_id == ward_id)
        batch_weight_query = batch_weight_query.where(CollectedBatch.ward_id == ward_id)
        processed_weight_query = processed_weight_query.where(CollectedBatch.ward_id == ward_id)
        landfill_weight_query = landfill_weight_query.where(ProcessingFacility.ward_id == ward_id)

    if zone_id:
        households_query = households_query.where(Household.zone_id == zone_id)
        generators_query = generators_query.where(BulkWasteGenerator.zone_id == zone_id)
        workers_query = workers_query.where(WorkerProfile.zone_id == zone_id)
        pickups_query = pickups_query.where(PickupTask.zone_id == zone_id)
        batch_weight_query = batch_weight_query.where(CollectedBatch.zone_id == zone_id)
        processed_weight_query = processed_weight_query.where(CollectedBatch.zone_id == zone_id)
        landfill_weight_query = landfill_weight_query.where(ProcessingFacility.zone_id == zone_id)

    pickups_query = _apply_pickup_date_filters(pickups_query, PickupTask.scheduled_date, date_from, date_to)
    batch_weight_query = _apply_pickup_date_filters(batch_weight_query, CollectedBatch.created_date, date_from, date_to)
    processed_weight_query = _apply_datetime_date_filters(processed_weight_query, ProcessingRecord.processed_at, date_from, date_to)
    landfill_weight_query = _apply_pickup_date_filters(landfill_weight_query, LandfillRecord.disposal_date, date_from, date_to)

    total_households = int(db.scalar(households_query) or 0)
    total_bulk_generators = int(db.scalar(generators_query) or 0)
    total_active_workers = int(db.scalar(workers_query) or 0)
    total_pickup_tasks, completed_pickups, missed_pickups = db.execute(pickups_query).one()

    total_collected_weight = _coalesce_float(db.scalar(batch_weight_query))
    total_processed_weight = _coalesce_float(db.scalar(processed_weight_query))
    total_landfilled_weight = _coalesce_float(db.scalar(landfill_weight_query))

    landfill_diversion_percent = 0.0
    if total_collected_weight > 0:
        landfill_diversion_percent = max(
            0.0,
            min(100.0, ((total_collected_weight - total_landfilled_weight) / total_collected_weight) * 100.0),
        )

    event_query = select(CarbonEvent).options(
        selectinload(CarbonEvent.batch),
        selectinload(CarbonEvent.facility),
        selectinload(CarbonEvent.processing_record).selectinload(ProcessingRecord.batch),
        selectinload(CarbonEvent.landfill_record).selectinload(LandfillRecord.facility),
        selectinload(CarbonEvent.recovery_certificate).selectinload(RecoveryCertificate.batch),
        selectinload(CarbonEvent.recovery_certificate).selectinload(RecoveryCertificate.facility),
    )
    event_query = _apply_pickup_date_filters(event_query, CarbonEvent.event_date, date_from, date_to)

    avoided = 0.0
    net = 0.0
    for event in db.scalars(event_query).all():
        ev_city, ev_ward, _ = derive_scope_from_carbon_event(event)
        if ev_city != city_id:
            continue
        if ward_id and ev_ward != ward_id:
            continue
        if zone_id:
            ev_zone = None
            if event.batch:
                ev_zone = event.batch.zone_id
            elif event.facility:
                ev_zone = event.facility.zone_id
            elif event.processing_record:
                ev_zone = event.processing_record.batch.zone_id
            elif event.landfill_record:
                ev_zone = event.landfill_record.facility.zone_id
            elif event.recovery_certificate:
                ev_zone = event.recovery_certificate.batch.zone_id
            if ev_zone != zone_id:
                continue

        avoided += _coalesce_float(event.avoided_emission_kgco2e)
        net += _coalesce_float(event.net_emission_kgco2e)

    return DashboardMetricBundle(
        total_households=total_households,
        total_bulk_generators=total_bulk_generators,
        total_active_workers=total_active_workers,
        total_pickup_tasks=int(total_pickup_tasks or 0),
        completed_pickups=int(completed_pickups or 0),
        missed_pickups=int(missed_pickups or 0),
        total_collected_weight_kg=total_collected_weight,
        total_processed_weight_kg=total_processed_weight,
        total_landfilled_weight_kg=total_landfilled_weight,
        landfill_diversion_percent=landfill_diversion_percent,
        avoided_emissions_kgco2e=avoided,
        net_emissions_kgco2e=net,
    )


def get_city_dashboard_overview(
    db: Session,
    city_id: UUID,
    date_from: date | None = None,
    date_to: date | None = None,
) -> CityOverviewResponse:
    metrics = _aggregate_dashboard_metrics(db, city_id=city_id, date_from=date_from, date_to=date_to)
    return CityOverviewResponse(city_id=city_id, date_from=date_from, date_to=date_to, metrics=metrics)


def get_ward_dashboard_overview(
    db: Session,
    city_id: UUID,
    ward_id: UUID,
    zone_id: UUID | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
) -> WardOverviewResponse:
    metrics = _aggregate_dashboard_metrics(
        db,
        city_id=city_id,
        ward_id=ward_id,
        zone_id=zone_id,
        date_from=date_from,
        date_to=date_to,
    )
    return WardOverviewResponse(city_id=city_id, ward_id=ward_id, date_from=date_from, date_to=date_to, metrics=metrics)


def get_city_ward_comparison(
    db: Session,
    city_id: UUID,
    date_from: date | None = None,
    date_to: date | None = None,
) -> CityWardComparisonResponse:
    city_metrics = _aggregate_dashboard_metrics(db, city_id=city_id, date_from=date_from, date_to=date_to)
    ward_rows: list[WardComparisonRow] = []
    ward_query = select(Ward).where(Ward.city_id == city_id, Ward.is_active.is_(True)).order_by(Ward.name.asc())
    for ward in db.scalars(ward_query).all():
        ward_metrics = _aggregate_dashboard_metrics(
            db,
            city_id=city_id,
            ward_id=ward.id,
            date_from=date_from,
            date_to=date_to,
        )
        ward_rows.append(WardComparisonRow(ward_id=ward.id, ward_name=ward.name, metrics=ward_metrics))

    return CityWardComparisonResponse(
        city_id=city_id,
        date_from=date_from,
        date_to=date_to,
        city_summary=city_metrics,
        wards=ward_rows,
    )


def query_pickup_report(
    db: Session,
    *,
    city_id: UUID | None,
    ward_id: UUID | None,
    zone_id: UUID | None,
    date_from: date | None,
    date_to: date | None,
    status: PickupStatus | None,
    worker_id: UUID | None,
    route_id: UUID | None,
    generator_id: UUID | None,
    limit: int,
    offset: int,
) -> PickupReportPage:
    limit, offset = _normalize_limit_offset(limit, offset)

    conditions = []
    if city_id:
        conditions.append(PickupTask.city_id == city_id)
    if ward_id:
        conditions.append(PickupTask.ward_id == ward_id)
    if zone_id:
        conditions.append(PickupTask.zone_id == zone_id)
    if status:
        conditions.append(PickupTask.pickup_status == status)
    if worker_id:
        conditions.append(PickupTask.assigned_worker_id == worker_id)
    if route_id:
        conditions.append(PickupTask.route_id == route_id)
    if generator_id:
        conditions.append(PickupTask.bulk_generator_id == generator_id)
    if date_from:
        conditions.append(PickupTask.scheduled_date >= date_from)
    if date_to:
        conditions.append(PickupTask.scheduled_date <= date_to)

    total_count = int(db.scalar(select(func.count(PickupTask.id)).where(*conditions)) or 0)

    summary_stmt = select(
        func.count(PickupTask.id),
        func.coalesce(func.sum(case((PickupTask.pickup_status == PickupStatus.COMPLETED, 1), else_=0)), 0),
        func.coalesce(func.sum(case((PickupTask.pickup_status == PickupStatus.MISSED, 1), else_=0)), 0),
        func.coalesce(func.sum(PickupTask.actual_weight_kg), 0.0),
    ).where(*conditions)
    total_tasks, completed_tasks, missed_tasks, total_actual_weight = db.execute(summary_stmt).one()

    rows_query = (
        select(PickupTask)
        .where(*conditions)
        .order_by(PickupTask.scheduled_date.desc(), PickupTask.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    tasks = db.scalars(rows_query).all()
    rows = [
        PickupReportRow(
            id=t.id,
            city_id=t.city_id,
            ward_id=t.ward_id,
            zone_id=t.zone_id,
            route_id=t.route_id,
            assigned_worker_id=t.assigned_worker_id,
            source_type=t.source_type.value,
            household_id=t.household_id,
            bulk_generator_id=t.bulk_generator_id,
            scheduled_date=t.scheduled_date,
            pickup_status=t.pickup_status,
            actual_weight_kg=t.actual_weight_kg,
            contamination_flag=t.contamination_flag,
        )
        for t in tasks
    ]

    return PickupReportPage(
        meta=_build_meta(
            total_count,
            limit,
            offset,
            city_id=city_id,
            ward_id=ward_id,
            zone_id=zone_id,
            date_from=date_from,
            date_to=date_to,
            status=status,
            worker_id=worker_id,
            route_id=route_id,
            generator_id=generator_id,
        ),
        summary=PickupReportSummary(
            total_tasks=int(total_tasks or 0),
            completed_tasks=int(completed_tasks or 0),
            missed_tasks=int(missed_tasks or 0),
            total_actual_weight_kg=_coalesce_float(total_actual_weight),
        ),
        rows=rows,
    )


def query_worker_report(
    db: Session,
    *,
    city_id: UUID | None,
    ward_id: UUID | None,
    zone_id: UUID | None,
    date_from: date | None,
    date_to: date | None,
    status: EmploymentStatus | None,
    worker_id: UUID | None,
    limit: int,
    offset: int,
) -> WorkerReportPage:
    limit, offset = _normalize_limit_offset(limit, offset)

    conditions = []
    if city_id:
        conditions.append(WorkerProfile.city_id == city_id)
    if ward_id:
        conditions.append(WorkerProfile.ward_id == ward_id)
    if zone_id:
        conditions.append(WorkerProfile.zone_id == zone_id)
    if status:
        conditions.append(WorkerProfile.employment_status == status)
    if worker_id:
        conditions.append(WorkerProfile.id == worker_id)

    total_count = int(db.scalar(select(func.count(WorkerProfile.id)).where(*conditions)) or 0)

    worker_rows_stmt = (
        select(WorkerProfile, User)
        .join(User, User.id == WorkerProfile.user_id)
        .where(*conditions)
        .order_by(WorkerProfile.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    worker_rows = db.execute(worker_rows_stmt).all()
    worker_ids = [worker.id for worker, _ in worker_rows]

    task_agg: dict[UUID, tuple[int, int, int, float]] = {}
    if worker_ids:
        task_conditions = [PickupTask.assigned_worker_id.in_(worker_ids)]
        if date_from:
            task_conditions.append(PickupTask.scheduled_date >= date_from)
        if date_to:
            task_conditions.append(PickupTask.scheduled_date <= date_to)

        agg_stmt = (
            select(
                PickupTask.assigned_worker_id,
                func.count(PickupTask.id),
                func.coalesce(func.sum(case((PickupTask.pickup_status == PickupStatus.COMPLETED, 1), else_=0)), 0),
                func.coalesce(func.sum(case((PickupTask.pickup_status == PickupStatus.MISSED, 1), else_=0)), 0),
                func.coalesce(func.sum(PickupTask.actual_weight_kg), 0.0),
            )
            .where(*task_conditions)
            .group_by(PickupTask.assigned_worker_id)
        )
        for row in db.execute(agg_stmt).all():
            task_agg[row[0]] = (int(row[1] or 0), int(row[2] or 0), int(row[3] or 0), _coalesce_float(row[4]))

    rows: list[WorkerReportRow] = []
    for worker, user in worker_rows:
        assigned_tasks, completed_tasks, missed_tasks, completed_weight = task_agg.get(worker.id, (0, 0, 0, 0.0))
        rows.append(
            WorkerReportRow(
                worker_id=worker.id,
                user_id=worker.user_id,
                full_name=user.full_name,
                employee_code=worker.employee_code,
                city_id=worker.city_id,
                ward_id=worker.ward_id,
                zone_id=worker.zone_id,
                employment_status=worker.employment_status,
                is_active=worker.is_active,
                assigned_tasks=assigned_tasks,
                completed_tasks=completed_tasks,
                missed_tasks=missed_tasks,
                completed_weight_kg=completed_weight,
            )
        )

    active_workers = int(
        db.scalar(
            select(func.count(WorkerProfile.id)).where(*conditions, WorkerProfile.employment_status == EmploymentStatus.ACTIVE)
        )
        or 0
    )

    worker_id_subquery = select(WorkerProfile.id).where(*conditions)
    global_task_conditions = [PickupTask.assigned_worker_id.in_(worker_id_subquery)]
    if date_from:
        global_task_conditions.append(PickupTask.scheduled_date >= date_from)
    if date_to:
        global_task_conditions.append(PickupTask.scheduled_date <= date_to)

    task_summary_stmt = select(
        func.count(PickupTask.id),
        func.coalesce(func.sum(case((PickupTask.pickup_status == PickupStatus.COMPLETED, 1), else_=0)), 0),
        func.coalesce(func.sum(PickupTask.actual_weight_kg), 0.0),
    ).where(*global_task_conditions)
    total_assigned_tasks, total_completed_tasks, total_completed_weight = db.execute(task_summary_stmt).one()

    return WorkerReportPage(
        meta=_build_meta(
            total_count,
            limit,
            offset,
            city_id=city_id,
            ward_id=ward_id,
            zone_id=zone_id,
            date_from=date_from,
            date_to=date_to,
            status=status,
            worker_id=worker_id,
        ),
        summary=WorkerReportSummary(
            total_workers=total_count,
            active_workers=active_workers,
            total_assigned_tasks=int(total_assigned_tasks or 0),
            total_completed_tasks=int(total_completed_tasks or 0),
            total_completed_weight_kg=_coalesce_float(total_completed_weight),
        ),
        rows=rows,
    )


def query_route_report(
    db: Session,
    *,
    city_id: UUID | None,
    ward_id: UUID | None,
    zone_id: UUID | None,
    date_from: date | None,
    date_to: date | None,
    route_id: UUID | None,
    limit: int,
    offset: int,
) -> RouteReportPage:
    limit, offset = _normalize_limit_offset(limit, offset)

    conditions = []
    if city_id:
        conditions.append(Route.city_id == city_id)
    if ward_id:
        conditions.append(Route.ward_id == ward_id)
    if zone_id:
        conditions.append(Route.zone_id == zone_id)
    if route_id:
        conditions.append(Route.id == route_id)

    total_count = int(db.scalar(select(func.count(Route.id)).where(*conditions)) or 0)

    route_stmt = select(Route).where(*conditions).order_by(Route.created_at.desc()).limit(limit).offset(offset)
    routes = db.scalars(route_stmt).all()
    route_ids = [r.id for r in routes]

    stop_counts: dict[UUID, int] = {}
    task_counts: dict[UUID, tuple[int, int, int, float]] = {}
    if route_ids:
        stop_stmt = select(RouteStop.route_id, func.count(RouteStop.id)).where(RouteStop.route_id.in_(route_ids)).group_by(RouteStop.route_id)
        for rid, count_value in db.execute(stop_stmt).all():
            stop_counts[rid] = int(count_value or 0)

        task_conditions = [PickupTask.route_id.in_(route_ids)]
        if date_from:
            task_conditions.append(PickupTask.scheduled_date >= date_from)
        if date_to:
            task_conditions.append(PickupTask.scheduled_date <= date_to)

        task_stmt = (
            select(
                PickupTask.route_id,
                func.count(PickupTask.id),
                func.coalesce(func.sum(case((PickupTask.pickup_status == PickupStatus.COMPLETED, 1), else_=0)), 0),
                func.coalesce(func.sum(case((PickupTask.pickup_status == PickupStatus.MISSED, 1), else_=0)), 0),
                func.coalesce(func.sum(PickupTask.actual_weight_kg), 0.0),
            )
            .where(*task_conditions)
            .group_by(PickupTask.route_id)
        )
        for row in db.execute(task_stmt).all():
            task_counts[row[0]] = (int(row[1] or 0), int(row[2] or 0), int(row[3] or 0), _coalesce_float(row[4]))

    rows = []
    for route in routes:
        total_tasks, completed_tasks, missed_tasks, completed_weight = task_counts.get(route.id, (0, 0, 0, 0.0))
        rows.append(
            RouteReportRow(
                route_id=route.id,
                route_code=route.route_code,
                route_name=route.name,
                city_id=route.city_id,
                ward_id=route.ward_id,
                zone_id=route.zone_id,
                total_stops=stop_counts.get(route.id, 0),
                total_tasks=total_tasks,
                completed_tasks=completed_tasks,
                missed_tasks=missed_tasks,
                completed_weight_kg=completed_weight,
            )
        )

    route_id_subquery = select(Route.id).where(*conditions)
    task_summary_conditions = [PickupTask.route_id.in_(route_id_subquery)]
    if date_from:
        task_summary_conditions.append(PickupTask.scheduled_date >= date_from)
    if date_to:
        task_summary_conditions.append(PickupTask.scheduled_date <= date_to)

    task_summary_stmt = select(
        func.count(PickupTask.id),
        func.coalesce(func.sum(case((PickupTask.pickup_status == PickupStatus.COMPLETED, 1), else_=0)), 0),
        func.coalesce(func.sum(PickupTask.actual_weight_kg), 0.0),
    ).where(*task_summary_conditions)
    total_tasks, total_completed_tasks, total_completed_weight = db.execute(task_summary_stmt).one()

    return RouteReportPage(
        meta=_build_meta(
            total_count,
            limit,
            offset,
            city_id=city_id,
            ward_id=ward_id,
            zone_id=zone_id,
            date_from=date_from,
            date_to=date_to,
            route_id=route_id,
        ),
        summary=RouteReportSummary(
            total_routes=total_count,
            total_tasks=int(total_tasks or 0),
            total_completed_tasks=int(total_completed_tasks or 0),
            total_completed_weight_kg=_coalesce_float(total_completed_weight),
        ),
        rows=rows,
    )


def query_facility_report(
    db: Session,
    *,
    city_id: UUID | None,
    ward_id: UUID | None,
    zone_id: UUID | None,
    date_from: date | None,
    date_to: date | None,
    facility_id: UUID | None,
    status: bool | None,
    verification_status: VerificationStatus | None,
    limit: int,
    offset: int,
) -> FacilityReportPage:
    limit, offset = _normalize_limit_offset(limit, offset)

    conditions = []
    if city_id:
        conditions.append(ProcessingFacility.city_id == city_id)
    if ward_id:
        conditions.append(ProcessingFacility.ward_id == ward_id)
    if zone_id:
        conditions.append(ProcessingFacility.zone_id == zone_id)
    if facility_id:
        conditions.append(ProcessingFacility.id == facility_id)
    if status is not None:
        conditions.append(ProcessingFacility.is_active.is_(status))

    total_count = int(db.scalar(select(func.count(ProcessingFacility.id)).where(*conditions)) or 0)
    facility_stmt = select(ProcessingFacility).where(*conditions).order_by(ProcessingFacility.created_at.desc()).limit(limit).offset(offset)
    facilities = db.scalars(facility_stmt).all()
    facility_ids = [f.id for f in facilities]

    transfer_map: dict[UUID, int] = {}
    processing_map: dict[UUID, float] = {}
    landfill_map: dict[UUID, float] = {}
    certificate_map: dict[UUID, tuple[int, float]] = {}

    if facility_ids:
        transfer_stmt = select(TransferRecord.to_facility_id, func.count(TransferRecord.id)).where(
            TransferRecord.to_facility_id.in_(facility_ids)
        )
        transfer_stmt = _apply_datetime_date_filters(transfer_stmt, TransferRecord.dispatched_at, date_from, date_to)
        transfer_stmt = transfer_stmt.group_by(TransferRecord.to_facility_id)
        for fid, count_value in db.execute(transfer_stmt).all():
            transfer_map[fid] = int(count_value or 0)

        processing_stmt = select(ProcessingRecord.facility_id, func.coalesce(func.sum(ProcessingRecord.input_weight_kg), 0.0)).where(
            ProcessingRecord.facility_id.in_(facility_ids)
        )
        processing_stmt = _apply_datetime_date_filters(processing_stmt, ProcessingRecord.processed_at, date_from, date_to)
        processing_stmt = processing_stmt.group_by(ProcessingRecord.facility_id)
        for fid, value in db.execute(processing_stmt).all():
            processing_map[fid] = _coalesce_float(value)

        landfill_stmt = select(LandfillRecord.facility_id, func.coalesce(func.sum(LandfillRecord.waste_weight_kg), 0.0)).where(
            LandfillRecord.facility_id.in_(facility_ids)
        )
        landfill_stmt = _apply_pickup_date_filters(landfill_stmt, LandfillRecord.disposal_date, date_from, date_to)
        landfill_stmt = landfill_stmt.group_by(LandfillRecord.facility_id)
        for fid, value in db.execute(landfill_stmt).all():
            landfill_map[fid] = _coalesce_float(value)

        cert_conditions = [RecoveryCertificate.facility_id.in_(facility_ids)]
        if verification_status:
            cert_conditions.append(RecoveryCertificate.verification_status == verification_status)
        cert_stmt = select(
            RecoveryCertificate.facility_id,
            func.count(RecoveryCertificate.id),
            func.coalesce(func.sum(RecoveryCertificate.certified_weight_kg), 0.0),
        ).where(*cert_conditions)
        cert_stmt = _apply_pickup_date_filters(cert_stmt, RecoveryCertificate.issue_date, date_from, date_to)
        cert_stmt = cert_stmt.group_by(RecoveryCertificate.facility_id)
        for fid, count_value, sum_weight in db.execute(cert_stmt).all():
            certificate_map[fid] = (int(count_value or 0), _coalesce_float(sum_weight))

    rows: list[FacilityReportRow] = []
    for facility in facilities:
        cert_count, cert_weight = certificate_map.get(facility.id, (0, 0.0))
        rows.append(
            FacilityReportRow(
                facility_id=facility.id,
                facility_code=facility.facility_code,
                name=facility.name,
                city_id=facility.city_id,
                ward_id=facility.ward_id,
                zone_id=facility.zone_id,
                is_active=facility.is_active,
                total_transfers=transfer_map.get(facility.id, 0),
                total_processed_weight_kg=processing_map.get(facility.id, 0.0),
                total_landfilled_weight_kg=landfill_map.get(facility.id, 0.0),
                total_certificates=cert_count,
                certified_weight_kg=cert_weight,
            )
        )

    facility_subq = select(ProcessingFacility.id).where(*conditions)
    transfer_total_stmt = select(func.count(TransferRecord.id)).where(TransferRecord.to_facility_id.in_(facility_subq))
    transfer_total_stmt = _apply_datetime_date_filters(transfer_total_stmt, TransferRecord.dispatched_at, date_from, date_to)
    total_transfers = int(db.scalar(transfer_total_stmt) or 0)

    process_total_stmt = select(func.coalesce(func.sum(ProcessingRecord.input_weight_kg), 0.0)).where(
        ProcessingRecord.facility_id.in_(facility_subq)
    )
    process_total_stmt = _apply_datetime_date_filters(process_total_stmt, ProcessingRecord.processed_at, date_from, date_to)
    total_processed = _coalesce_float(db.scalar(process_total_stmt))

    landfill_total_stmt = select(func.coalesce(func.sum(LandfillRecord.waste_weight_kg), 0.0)).where(
        LandfillRecord.facility_id.in_(facility_subq)
    )
    landfill_total_stmt = _apply_pickup_date_filters(landfill_total_stmt, LandfillRecord.disposal_date, date_from, date_to)
    total_landfilled = _coalesce_float(db.scalar(landfill_total_stmt))

    cert_total_conditions = [RecoveryCertificate.facility_id.in_(facility_subq)]
    if verification_status:
        cert_total_conditions.append(RecoveryCertificate.verification_status == verification_status)
    cert_total_stmt = select(func.count(RecoveryCertificate.id)).where(*cert_total_conditions)
    cert_total_stmt = _apply_pickup_date_filters(cert_total_stmt, RecoveryCertificate.issue_date, date_from, date_to)
    total_certificates = int(db.scalar(cert_total_stmt) or 0)

    return FacilityReportPage(
        meta=_build_meta(
            total_count,
            limit,
            offset,
            city_id=city_id,
            ward_id=ward_id,
            zone_id=zone_id,
            date_from=date_from,
            date_to=date_to,
            facility_id=facility_id,
            status=status,
            verification_status=verification_status,
        ),
        summary=FacilityReportSummary(
            total_facilities=total_count,
            total_transfers=total_transfers,
            total_processed_weight_kg=total_processed,
            total_landfilled_weight_kg=total_landfilled,
            total_certificates=total_certificates,
        ),
        rows=rows,
    )


def query_transfer_report(
    db: Session,
    *,
    city_id: UUID | None,
    ward_id: UUID | None,
    date_from: date | None,
    date_to: date | None,
    status: TransferStatus | None,
    route_id: UUID | None,
    facility_id: UUID | None,
    limit: int,
    offset: int,
) -> TransferReportPage:
    limit, offset = _normalize_limit_offset(limit, offset)

    conditions = []
    if facility_id:
        conditions.append(TransferRecord.to_facility_id == facility_id)
    if status:
        conditions.append(TransferRecord.transfer_status == status)

    stmt = select(TransferRecord).join(CollectedBatch, CollectedBatch.id == TransferRecord.batch_id)
    if city_id:
        conditions.append(CollectedBatch.city_id == city_id)
    if ward_id:
        conditions.append(CollectedBatch.ward_id == ward_id)
    if route_id:
        conditions.append(CollectedBatch.origin_route_id == route_id)

    if date_from:
        conditions.append(TransferRecord.dispatched_at >= datetime.combine(date_from, time.min))
    if date_to:
        conditions.append(TransferRecord.dispatched_at <= datetime.combine(date_to, time.max))

    total_count = int(db.scalar(select(func.count(TransferRecord.id)).select_from(TransferRecord).join(CollectedBatch).where(*conditions)) or 0)

    rows_query = stmt.where(*conditions).order_by(TransferRecord.dispatched_at.desc()).limit(limit).offset(offset)
    transfers = db.scalars(rows_query).all()

    rows = [
        TransferReportRow(
            transfer_id=t.id,
            batch_id=t.batch_id,
            to_facility_id=t.to_facility_id,
            city_id=t.batch.city_id,
            ward_id=t.batch.ward_id,
            transfer_status=t.transfer_status.value,
            dispatched_at=t.dispatched_at,
            received_at=t.received_at,
            dispatched_weight_kg=t.dispatched_weight_kg,
            received_weight_kg=t.received_weight_kg,
        )
        for t in transfers
    ]

    summary_stmt = select(
        func.count(TransferRecord.id),
        func.coalesce(func.sum(case((TransferRecord.transfer_status == TransferStatus.RECEIVED, 1), else_=0)), 0),
        func.coalesce(func.sum(TransferRecord.dispatched_weight_kg), 0.0),
        func.coalesce(func.sum(TransferRecord.received_weight_kg), 0.0),
    ).select_from(TransferRecord).join(CollectedBatch).where(*conditions)
    total_transfers, received_transfers, total_dispatched, total_received = db.execute(summary_stmt).one()

    return TransferReportPage(
        meta=_build_meta(
            total_count,
            limit,
            offset,
            city_id=city_id,
            ward_id=ward_id,
            date_from=date_from,
            date_to=date_to,
            status=status,
            route_id=route_id,
            facility_id=facility_id,
        ),
        summary=TransferReportSummary(
            total_transfers=int(total_transfers or 0),
            received_transfers=int(received_transfers or 0),
            total_dispatched_weight_kg=_coalesce_float(total_dispatched),
            total_received_weight_kg=_coalesce_float(total_received),
        ),
        rows=rows,
    )


def query_bulk_generator_report(
    db: Session,
    *,
    city_id: UUID | None,
    ward_id: UUID | None,
    zone_id: UUID | None,
    date_from: date | None,
    date_to: date | None,
    status: ComplianceStatus | None,
    generator_id: UUID | None,
    verification_status: VerificationStatus | None,
    limit: int,
    offset: int,
) -> BulkGeneratorReportPage:
    limit, offset = _normalize_limit_offset(limit, offset)

    conditions = []
    if city_id:
        conditions.append(BulkWasteGenerator.city_id == city_id)
    if ward_id:
        conditions.append(BulkWasteGenerator.ward_id == ward_id)
    if zone_id:
        conditions.append(BulkWasteGenerator.zone_id == zone_id)
    if status:
        conditions.append(BulkWasteGenerator.compliance_status == status)
    if generator_id:
        conditions.append(BulkWasteGenerator.id == generator_id)

    total_count = int(db.scalar(select(func.count(BulkWasteGenerator.id)).where(*conditions)) or 0)
    generator_stmt = select(BulkWasteGenerator).where(*conditions).order_by(BulkWasteGenerator.created_at.desc()).limit(limit).offset(offset)
    generators = db.scalars(generator_stmt).all()
    generator_ids = [g.id for g in generators]

    pickup_map: dict[UUID, tuple[int, int, int, float]] = {}
    cert_map: dict[UUID, tuple[int, float]] = {}

    if generator_ids:
        pickup_conditions = [PickupTask.bulk_generator_id.in_(generator_ids)]
        if date_from:
            pickup_conditions.append(PickupTask.scheduled_date >= date_from)
        if date_to:
            pickup_conditions.append(PickupTask.scheduled_date <= date_to)

        pickup_stmt = (
            select(
                PickupTask.bulk_generator_id,
                func.count(PickupTask.id),
                func.coalesce(func.sum(case((PickupTask.pickup_status == PickupStatus.COMPLETED, 1), else_=0)), 0),
                func.coalesce(func.sum(case((PickupTask.pickup_status == PickupStatus.MISSED, 1), else_=0)), 0),
                func.coalesce(func.sum(PickupTask.actual_weight_kg), 0.0),
            )
            .where(*pickup_conditions)
            .group_by(PickupTask.bulk_generator_id)
        )
        for row in db.execute(pickup_stmt).all():
            pickup_map[row[0]] = (int(row[1] or 0), int(row[2] or 0), int(row[3] or 0), _coalesce_float(row[4]))

        cert_conditions = [RecoveryCertificate.bulk_generator_id.in_(generator_ids)]
        if verification_status:
            cert_conditions.append(RecoveryCertificate.verification_status == verification_status)
        cert_stmt = (
            select(
                RecoveryCertificate.bulk_generator_id,
                func.count(RecoveryCertificate.id),
                func.coalesce(func.sum(RecoveryCertificate.certified_weight_kg), 0.0),
            )
            .where(*cert_conditions)
            .group_by(RecoveryCertificate.bulk_generator_id)
        )
        cert_stmt = _apply_pickup_date_filters(cert_stmt, RecoveryCertificate.issue_date, date_from, date_to)
        for row in db.execute(cert_stmt).all():
            cert_map[row[0]] = (int(row[1] or 0), _coalesce_float(row[2]))

    rows = []
    for g in generators:
        total_pickups, completed_pickups, missed_pickups, picked_weight = pickup_map.get(g.id, (0, 0, 0, 0.0))
        total_certs, cert_weight = cert_map.get(g.id, (0, 0.0))
        rows.append(
            BulkGeneratorReportRow(
                generator_id=g.id,
                generator_code=g.generator_code,
                entity_name=g.entity_name,
                city_id=g.city_id,
                ward_id=g.ward_id,
                zone_id=g.zone_id,
                generator_type=g.generator_type.value,
                compliance_status=g.compliance_status,
                onboarding_status=g.onboarding_status.value,
                is_active=g.is_active,
                total_pickups=total_pickups,
                completed_pickups=completed_pickups,
                missed_pickups=missed_pickups,
                total_picked_weight_kg=picked_weight,
                total_certificates=total_certs,
                certified_weight_kg=cert_weight,
            )
        )

    base_generator_subquery = select(BulkWasteGenerator.id).where(*conditions)

    pickup_total_stmt = select(func.count(PickupTask.id)).where(PickupTask.bulk_generator_id.in_(base_generator_subquery))
    pickup_total_stmt = _apply_pickup_date_filters(pickup_total_stmt, PickupTask.scheduled_date, date_from, date_to)
    total_pickups = int(db.scalar(pickup_total_stmt) or 0)

    cert_total_conditions = [RecoveryCertificate.bulk_generator_id.in_(base_generator_subquery)]
    if verification_status:
        cert_total_conditions.append(RecoveryCertificate.verification_status == verification_status)
    cert_total_stmt = select(
        func.count(RecoveryCertificate.id),
        func.coalesce(func.sum(RecoveryCertificate.certified_weight_kg), 0.0),
    ).where(*cert_total_conditions)
    cert_total_stmt = _apply_pickup_date_filters(cert_total_stmt, RecoveryCertificate.issue_date, date_from, date_to)
    total_certificates, total_certified_weight = db.execute(cert_total_stmt).one()

    compliant_generators = int(
        db.scalar(select(func.count(BulkWasteGenerator.id)).where(*conditions, BulkWasteGenerator.compliance_status == ComplianceStatus.COMPLIANT))
        or 0
    )
    non_compliant_generators = int(
        db.scalar(
            select(func.count(BulkWasteGenerator.id)).where(*conditions, BulkWasteGenerator.compliance_status == ComplianceStatus.NON_COMPLIANT)
        )
        or 0
    )

    return BulkGeneratorReportPage(
        meta=_build_meta(
            total_count,
            limit,
            offset,
            city_id=city_id,
            ward_id=ward_id,
            zone_id=zone_id,
            date_from=date_from,
            date_to=date_to,
            status=status,
            generator_id=generator_id,
            verification_status=verification_status,
        ),
        summary=BulkGeneratorReportSummary(
            total_generators=total_count,
            compliant_generators=compliant_generators,
            non_compliant_generators=non_compliant_generators,
            total_pickups=total_pickups,
            total_certificates=int(total_certificates or 0),
            total_certified_weight_kg=_coalesce_float(total_certified_weight),
        ),
        rows=rows,
    )


def query_environmental_summary_report(
    db: Session,
    *,
    city_id: UUID | None,
    ward_id: UUID | None,
    date_from: date | None,
    date_to: date | None,
    status: SummaryStatus | None,
    limit: int,
    offset: int,
) -> EnvironmentalSummaryReportPage:
    limit, offset = _normalize_limit_offset(limit, offset)

    conditions = []
    if city_id:
        conditions.append(EnvironmentalSummary.city_id == city_id)
    if ward_id:
        conditions.append(EnvironmentalSummary.ward_id == ward_id)
    if status:
        conditions.append(EnvironmentalSummary.summary_status == status)
    if date_from:
        conditions.append(EnvironmentalSummary.generated_at >= datetime.combine(date_from, time.min))
    if date_to:
        conditions.append(EnvironmentalSummary.generated_at <= datetime.combine(date_to, time.max))

    total_count = int(db.scalar(select(func.count(EnvironmentalSummary.id)).where(*conditions)) or 0)

    row_stmt = (
        select(EnvironmentalSummary)
        .where(*conditions)
        .order_by(EnvironmentalSummary.generated_at.desc())
        .limit(limit)
        .offset(offset)
    )
    summaries = db.scalars(row_stmt).all()

    rows = [
        EnvironmentalSummaryReportRow(
            summary_id=s.id,
            city_id=s.city_id,
            ward_id=s.ward_id,
            reporting_month=s.reporting_month,
            reporting_year=s.reporting_year,
            summary_status=s.summary_status.value,
            total_collected_kg=s.total_collected_kg,
            total_processed_kg=s.total_processed_kg,
            total_landfilled_kg=s.total_landfilled_kg,
            landfill_diversion_percent=s.landfill_diversion_percent,
            avoided_emission_kgco2e=s.avoided_emission_kgco2e,
            net_emission_kgco2e=s.net_emission_kgco2e,
            generated_at=s.generated_at,
        )
        for s in summaries
    ]

    summary_stmt = select(
        func.count(EnvironmentalSummary.id),
        func.coalesce(func.sum(EnvironmentalSummary.total_collected_kg), 0.0),
        func.coalesce(func.sum(EnvironmentalSummary.total_processed_kg), 0.0),
        func.coalesce(func.sum(EnvironmentalSummary.total_landfilled_kg), 0.0),
        func.coalesce(func.sum(EnvironmentalSummary.avoided_emission_kgco2e), 0.0),
        func.coalesce(func.sum(EnvironmentalSummary.net_emission_kgco2e), 0.0),
    ).where(*conditions)
    total_summaries, collected_kg, processed_kg, landfilled_kg, avoided_emission, net_emission = db.execute(summary_stmt).one()

    return EnvironmentalSummaryReportPage(
        meta=_build_meta(
            total_count,
            limit,
            offset,
            city_id=city_id,
            ward_id=ward_id,
            date_from=date_from,
            date_to=date_to,
            status=status,
        ),
        summary=EnvironmentalSummaryReportSummary(
            total_summaries=int(total_summaries or 0),
            collected_kg=_coalesce_float(collected_kg),
            processed_kg=_coalesce_float(processed_kg),
            landfilled_kg=_coalesce_float(landfilled_kg),
            avoided_emission_kgco2e=_coalesce_float(avoided_emission),
            net_emission_kgco2e=_coalesce_float(net_emission),
        ),
        rows=rows,
    )


def query_carbon_ledger_report(
    db: Session,
    *,
    city_id: UUID | None,
    ward_id: UUID | None,
    date_from: date | None,
    date_to: date | None,
    status: LedgerEntryType | None,
    facility_id: UUID | None,
    generator_id: UUID | None,
    verification_status: VerificationStatus | None,
    limit: int,
    offset: int,
) -> CarbonLedgerReportPage:
    limit, offset = _normalize_limit_offset(limit, offset)

    conditions = []
    stmt = select(CarbonLedgerEntry).join(CarbonEvent, CarbonEvent.id == CarbonLedgerEntry.carbon_event_id)

    if city_id:
        conditions.append(CarbonLedgerEntry.city_id == city_id)
    if ward_id:
        conditions.append(CarbonLedgerEntry.ward_id == ward_id)
    if status:
        conditions.append(CarbonLedgerEntry.entry_type == status)
    if verification_status:
        conditions.append(CarbonLedgerEntry.verification_status == verification_status)
    if date_from:
        conditions.append(CarbonLedgerEntry.recorded_at >= datetime.combine(date_from, time.min))
    if date_to:
        conditions.append(CarbonLedgerEntry.recorded_at <= datetime.combine(date_to, time.max))
    if facility_id:
        conditions.append(
            or_(
                CarbonEvent.facility_id == facility_id,
                CarbonEvent.processing_record_id.in_(
                    select(ProcessingRecord.id).where(ProcessingRecord.facility_id == facility_id)
                ),
                CarbonEvent.landfill_record_id.in_(
                    select(LandfillRecord.id).where(LandfillRecord.facility_id == facility_id)
                ),
                CarbonEvent.recovery_certificate_id.in_(
                    select(RecoveryCertificate.id).where(RecoveryCertificate.facility_id == facility_id)
                ),
            )
        )
    if generator_id:
        conditions.append(
            CarbonEvent.recovery_certificate_id.in_(
                select(RecoveryCertificate.id).where(RecoveryCertificate.bulk_generator_id == generator_id)
            )
        )

    total_count = int(
        db.scalar(
            select(func.count(CarbonLedgerEntry.id))
            .select_from(CarbonLedgerEntry)
            .join(CarbonEvent, CarbonEvent.id == CarbonLedgerEntry.carbon_event_id)
            .where(*conditions)
        )
        or 0
    )

    row_stmt = stmt.where(*conditions).order_by(CarbonLedgerEntry.recorded_at.desc()).limit(limit).offset(offset)
    entries = db.scalars(row_stmt).all()

    rows = [
        CarbonLedgerReportRow(
            entry_id=e.id,
            carbon_event_id=e.carbon_event_id,
            city_id=e.city_id,
            ward_id=e.ward_id,
            entry_type=e.entry_type.value,
            verification_status=e.verification_status,
            period_month=e.period_month,
            period_year=e.period_year,
            quantity_kgco2e=e.quantity_kgco2e,
            recorded_at=e.recorded_at,
        )
        for e in entries
    ]

    summary_stmt = select(
        func.count(CarbonLedgerEntry.id),
        func.coalesce(func.sum(case((CarbonLedgerEntry.verification_status == VerificationStatus.VERIFIED, 1), else_=0)), 0),
        func.coalesce(func.sum(case((CarbonLedgerEntry.verification_status == VerificationStatus.REJECTED, 1), else_=0)), 0),
        func.coalesce(func.sum(CarbonLedgerEntry.quantity_kgco2e), 0.0),
    ).select_from(CarbonLedgerEntry).join(CarbonEvent, CarbonEvent.id == CarbonLedgerEntry.carbon_event_id).where(*conditions)
    total_entries, verified_entries, rejected_entries, total_quantity = db.execute(summary_stmt).one()

    return CarbonLedgerReportPage(
        meta=_build_meta(
            total_count,
            limit,
            offset,
            city_id=city_id,
            ward_id=ward_id,
            date_from=date_from,
            date_to=date_to,
            status=status,
            facility_id=facility_id,
            generator_id=generator_id,
            verification_status=verification_status,
        ),
        summary=CarbonLedgerReportSummary(
            total_entries=int(total_entries or 0),
            verified_entries=int(verified_entries or 0),
            rejected_entries=int(rejected_entries or 0),
            total_quantity_kgco2e=_coalesce_float(total_quantity),
        ),
        rows=rows,
    )


def _get_generator_or_404(db: Session, generator_id: UUID) -> BulkWasteGenerator:
    generator = db.get(BulkWasteGenerator, generator_id)
    if not generator:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bulk generator not found")
    return generator


def _build_profile_summary(generator: BulkWasteGenerator) -> GeneratorProfileSummary:
    return GeneratorProfileSummary(
        generator_id=generator.id,
        generator_code=generator.generator_code,
        entity_name=generator.entity_name,
        city_id=generator.city_id,
        ward_id=generator.ward_id,
        zone_id=generator.zone_id,
        generator_type=generator.generator_type.value,
        estimated_daily_waste_kg=generator.estimated_daily_waste_kg,
        compliance_status=generator.compliance_status,
        onboarding_status=generator.onboarding_status.value,
        is_active=generator.is_active,
    )


def _pickup_history_for_generator(
    db: Session,
    generator_id: UUID,
    date_from: date | None,
    date_to: date | None,
) -> PickupHistorySummary:
    stmt = select(
        func.count(PickupTask.id),
        func.coalesce(func.sum(case((PickupTask.pickup_status == PickupStatus.COMPLETED, 1), else_=0)), 0),
        func.coalesce(func.sum(case((PickupTask.pickup_status == PickupStatus.MISSED, 1), else_=0)), 0),
        func.coalesce(func.sum(PickupTask.actual_weight_kg), 0.0),
        func.max(PickupTask.scheduled_date),
    ).where(PickupTask.bulk_generator_id == generator_id)
    stmt = _apply_pickup_date_filters(stmt, PickupTask.scheduled_date, date_from, date_to)
    total, completed, missed, total_weight, latest_pickup = db.execute(stmt).one()

    completion_rate = 0.0
    if int(total or 0) > 0:
        completion_rate = (int(completed or 0) / int(total or 0)) * 100.0

    return PickupHistorySummary(
        total_pickups=int(total or 0),
        completed_pickups=int(completed or 0),
        missed_pickups=int(missed or 0),
        completion_rate_percent=completion_rate,
        total_collected_weight_kg=_coalesce_float(total_weight),
        latest_pickup_date=latest_pickup,
    )


def _certificate_summary_for_generator(
    db: Session,
    generator_id: UUID,
    date_from: date | None,
    date_to: date | None,
    verification_status: VerificationStatus | None,
) -> CertificateRecoverySummary:
    conditions = [RecoveryCertificate.bulk_generator_id == generator_id]
    if verification_status:
        conditions.append(RecoveryCertificate.verification_status == verification_status)

    stmt = select(
        func.count(RecoveryCertificate.id),
        func.coalesce(func.sum(case((RecoveryCertificate.verification_status == VerificationStatus.VERIFIED, 1), else_=0)), 0),
        func.coalesce(func.sum(case((RecoveryCertificate.verification_status == VerificationStatus.REJECTED, 1), else_=0)), 0),
        func.coalesce(func.sum(RecoveryCertificate.certified_weight_kg), 0.0),
        func.max(RecoveryCertificate.issue_date),
    ).where(*conditions)
    stmt = _apply_pickup_date_filters(stmt, RecoveryCertificate.issue_date, date_from, date_to)

    total, verified, rejected, certified_weight, latest_issue = db.execute(stmt).one()

    return CertificateRecoverySummary(
        total_certificates=int(total or 0),
        verified_certificates=int(verified or 0),
        rejected_certificates=int(rejected or 0),
        total_certified_weight_kg=_coalesce_float(certified_weight),
        total_recovered_weight_kg=_coalesce_float(certified_weight),
        latest_certificate_date=latest_issue,
    )


def get_bulk_generator_profile_report(
    db: Session,
    generator_id: UUID,
    *,
    date_from: date | None,
    date_to: date | None,
    verification_status: VerificationStatus | None,
) -> BulkGeneratorProfileReportResponse:
    generator = _get_generator_or_404(db, generator_id)
    return BulkGeneratorProfileReportResponse(
        profile=_build_profile_summary(generator),
        pickup_history=_pickup_history_for_generator(db, generator_id, date_from, date_to),
        certificate_recovery=_certificate_summary_for_generator(db, generator_id, date_from, date_to, verification_status),
    )


def build_bulk_generator_compliance_summary(
    db: Session,
    generator_id: UUID,
    *,
    date_from: date | None,
    date_to: date | None,
    verification_status: VerificationStatus | None,
) -> BulkGeneratorComplianceSummaryResponse:
    profile_report = get_bulk_generator_profile_report(
        db,
        generator_id,
        date_from=date_from,
        date_to=date_to,
        verification_status=verification_status,
    )

    cert_summary = profile_report.certificate_recovery
    verification_coverage = 0.0
    if cert_summary.total_certificates > 0:
        verification_coverage = (cert_summary.verified_certificates / cert_summary.total_certificates) * 100.0

    if profile_report.profile.compliance_status == ComplianceStatus.NON_COMPLIANT:
        action = "Immediate field inspection and escalation"
    elif profile_report.profile.compliance_status == ComplianceStatus.UNDER_REVIEW:
        action = "Complete pending verifications and compliance review"
    else:
        action = "Maintain periodic compliance monitoring"

    return BulkGeneratorComplianceSummaryResponse(
        profile=profile_report.profile,
        pickup_history=profile_report.pickup_history,
        certificate_recovery=cert_summary,
        compliance_status_view=ComplianceStatusView(
            current_status=profile_report.profile.compliance_status,
            verification_coverage_percent=verification_coverage,
            recommended_action=action,
        ),
    )


def processor_can_access_generator(db: Session, user: User, generator_id: UUID) -> bool:
    if user.ward_id:
        stmt = select(func.count(RecoveryCertificate.id)).join(
            ProcessingFacility, ProcessingFacility.id == RecoveryCertificate.facility_id
        ).where(
            RecoveryCertificate.bulk_generator_id == generator_id,
            ProcessingFacility.ward_id == user.ward_id,
        )
        return int(db.scalar(stmt) or 0) > 0

    if user.city_id:
        stmt = select(func.count(RecoveryCertificate.id)).join(
            ProcessingFacility, ProcessingFacility.id == RecoveryCertificate.facility_id
        ).where(
            RecoveryCertificate.bulk_generator_id == generator_id,
            ProcessingFacility.city_id == user.city_id,
        )
        return int(db.scalar(stmt) or 0) > 0

    return False


def assemble_batch_lifecycle_export(db: Session, batch_id: UUID) -> BatchLifecycleAuditExport:
    batch = db.get(CollectedBatch, batch_id)
    if not batch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found")

    transfers = list(db.scalars(select(TransferRecord).where(TransferRecord.batch_id == batch_id).order_by(TransferRecord.dispatched_at.asc())).all())
    transfer_ids = [t.id for t in transfers]

    facility_receipts = []
    if transfer_ids:
        facility_receipts = list(
            db.scalars(
                select(FacilityReceipt)
                .where(FacilityReceipt.transfer_record_id.in_(transfer_ids))
                .order_by(FacilityReceipt.received_at.asc())
            ).all()
        )

    processing_records = list(
        db.scalars(select(ProcessingRecord).where(ProcessingRecord.batch_id == batch_id).order_by(ProcessingRecord.processed_at.asc())).all()
    )
    landfill_records = list(
        db.scalars(select(LandfillRecord).where(LandfillRecord.batch_id == batch_id).order_by(LandfillRecord.disposal_date.asc())).all()
    )
    recovery_certificates = list(
        db.scalars(
            select(RecoveryCertificate).where(RecoveryCertificate.batch_id == batch_id).order_by(RecoveryCertificate.issue_date.asc())
        ).all()
    )

    carbon_events = list(
        db.scalars(
            select(CarbonEvent)
            .where(
                or_(
                    CarbonEvent.batch_id == batch_id,
                    CarbonEvent.processing_record_id.in_(select(ProcessingRecord.id).where(ProcessingRecord.batch_id == batch_id)),
                    CarbonEvent.recovery_certificate_id.in_(
                        select(RecoveryCertificate.id).where(RecoveryCertificate.batch_id == batch_id)
                    ),
                    CarbonEvent.landfill_record_id.in_(select(LandfillRecord.id).where(LandfillRecord.batch_id == batch_id)),
                )
            )
            .order_by(CarbonEvent.event_date.asc())
        ).all()
    )
    event_ids = [e.id for e in carbon_events]

    ledger_entries = []
    if event_ids:
        ledger_entries = list(
            db.scalars(
                select(CarbonLedgerEntry)
                .where(CarbonLedgerEntry.carbon_event_id.in_(event_ids))
                .order_by(CarbonLedgerEntry.recorded_at.asc())
            ).all()
        )

    return BatchLifecycleAuditExport(
        batch=CollectedBatchRead.model_validate(batch),
        transfers=[TransferRecordRead.model_validate(t) for t in transfers],
        facility_receipts=[FacilityReceiptRead.model_validate(r) for r in facility_receipts],
        processing_records=[ProcessingRecordRead.model_validate(r) for r in processing_records],
        landfill_records=[LandfillRecordRead.model_validate(r) for r in landfill_records],
        recovery_certificates=[RecoveryCertificateRead.model_validate(r) for r in recovery_certificates],
        carbon_events=[CarbonEventRead.model_validate(e) for e in carbon_events],
        carbon_ledger_entries=[CarbonLedgerEntryRead.model_validate(e) for e in ledger_entries],
        generated_at=datetime.utcnow(),
    )


def assemble_bulk_generator_lifecycle_export(db: Session, generator_id: UUID) -> BulkGeneratorLifecycleAuditExport:
    generator = _get_generator_or_404(db, generator_id)

    pickup_tasks = list(
        db.scalars(
            select(PickupTask)
            .where(PickupTask.bulk_generator_id == generator_id)
            .order_by(PickupTask.scheduled_date.asc(), PickupTask.created_at.asc())
        ).all()
    )

    recovery_certificates = list(
        db.scalars(
            select(RecoveryCertificate)
            .where(RecoveryCertificate.bulk_generator_id == generator_id)
            .order_by(RecoveryCertificate.issue_date.asc())
        ).all()
    )

    certificate_ids = [c.id for c in recovery_certificates]
    carbon_events = []
    if certificate_ids:
        carbon_events = list(
            db.scalars(
                select(CarbonEvent)
                .where(CarbonEvent.recovery_certificate_id.in_(certificate_ids))
                .order_by(CarbonEvent.event_date.asc())
            ).all()
        )

    event_ids = [e.id for e in carbon_events]
    ledger_entries = []
    if event_ids:
        ledger_entries = list(
            db.scalars(
                select(CarbonLedgerEntry)
                .where(CarbonLedgerEntry.carbon_event_id.in_(event_ids))
                .order_by(CarbonLedgerEntry.recorded_at.asc())
            ).all()
        )

    return BulkGeneratorLifecycleAuditExport(
        generator=BulkWasteGeneratorRead.model_validate(generator),
        pickup_tasks=[PickupTaskRead.model_validate(p) for p in pickup_tasks],
        recovery_certificates=[RecoveryCertificateRead.model_validate(c) for c in recovery_certificates],
        carbon_events=[CarbonEventRead.model_validate(e) for e in carbon_events],
        carbon_ledger_entries=[CarbonLedgerEntryRead.model_validate(l) for l in ledger_entries],
        generated_at=datetime.utcnow(),
    )


def assemble_carbon_event_lifecycle_export(db: Session, event_id: UUID) -> CarbonEventLifecycleAuditExport:
    event = db.get(CarbonEvent, event_id)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Carbon event not found")

    ledger_entries = list(
        db.scalars(
            select(CarbonLedgerEntry).where(CarbonLedgerEntry.carbon_event_id == event_id).order_by(CarbonLedgerEntry.recorded_at.asc())
        ).all()
    )
    verification_stmt = select(CarbonVerification).where(
        or_(
            CarbonVerification.carbon_event_id == event_id,
            CarbonVerification.ledger_entry_id.in_(
                select(CarbonLedgerEntry.id).where(CarbonLedgerEntry.carbon_event_id == event_id)
            ),
        )
    )
    verifications = list(db.scalars(verification_stmt).all())

    city_id, ward_id, _ = derive_scope_from_carbon_event(event)
    env_summary_stmt = select(EnvironmentalSummary)
    if city_id:
        env_summary_stmt = env_summary_stmt.where(EnvironmentalSummary.city_id == city_id)
    if ward_id:
        env_summary_stmt = env_summary_stmt.where(EnvironmentalSummary.ward_id == ward_id)
    if event.event_date:
        env_summary_stmt = env_summary_stmt.where(
            EnvironmentalSummary.reporting_year == event.event_date.year,
            EnvironmentalSummary.reporting_month == event.event_date.month,
        )
    env_summaries = list(db.scalars(env_summary_stmt.order_by(EnvironmentalSummary.generated_at.desc())).all())

    resolved_batch = event.batch
    if not resolved_batch and event.processing_record:
        resolved_batch = event.processing_record.batch
    if not resolved_batch and event.recovery_certificate:
        resolved_batch = event.recovery_certificate.batch
    if not resolved_batch and event.landfill_record and event.landfill_record.batch:
        resolved_batch = event.landfill_record.batch

    resolved_facility = event.facility
    if not resolved_facility and event.processing_record:
        resolved_facility = event.processing_record.facility
    if not resolved_facility and event.landfill_record:
        resolved_facility = event.landfill_record.facility
    if not resolved_facility and event.recovery_certificate:
        resolved_facility = event.recovery_certificate.facility

    return CarbonEventLifecycleAuditExport(
        carbon_event=CarbonEventRead.model_validate(event),
        batch=CollectedBatchRead.model_validate(resolved_batch) if resolved_batch else None,
        facility=ProcessingFacilityRead.model_validate(resolved_facility) if resolved_facility else None,
        processing_record=ProcessingRecordRead.model_validate(event.processing_record) if event.processing_record else None,
        landfill_record=LandfillRecordRead.model_validate(event.landfill_record) if event.landfill_record else None,
        recovery_certificate=RecoveryCertificateRead.model_validate(event.recovery_certificate)
        if event.recovery_certificate
        else None,
        ledger_entries=[CarbonLedgerEntryRead.model_validate(entry) for entry in ledger_entries],
        verifications=[CarbonVerificationRead.model_validate(v) for v in verifications],
        related_environmental_summaries=[EnvironmentalSummaryRead.model_validate(s) for s in env_summaries],
        generated_at=datetime.utcnow(),
    )


def _csv_from_rows(rows: Iterable[dict], fieldnames: list[str]) -> str:
    buffer = io.StringIO()
    writer = csv.DictWriter(buffer, fieldnames=fieldnames)
    writer.writeheader()
    for row in rows:
        writer.writerow(row)
    return buffer.getvalue()


def generate_pickups_csv(page: PickupReportPage) -> str:
    rows = [
        {
            "id": str(row.id),
            "city_id": str(row.city_id),
            "ward_id": str(row.ward_id),
            "zone_id": str(row.zone_id) if row.zone_id else "",
            "route_id": str(row.route_id) if row.route_id else "",
            "assigned_worker_id": str(row.assigned_worker_id) if row.assigned_worker_id else "",
            "source_type": row.source_type,
            "household_id": str(row.household_id) if row.household_id else "",
            "bulk_generator_id": str(row.bulk_generator_id) if row.bulk_generator_id else "",
            "scheduled_date": row.scheduled_date.isoformat(),
            "pickup_status": row.pickup_status.value,
            "actual_weight_kg": row.actual_weight_kg,
            "contamination_flag": row.contamination_flag,
        }
        for row in page.rows
    ]
    return _csv_from_rows(rows, list(rows[0].keys()) if rows else [
        "id",
        "city_id",
        "ward_id",
        "zone_id",
        "route_id",
        "assigned_worker_id",
        "source_type",
        "household_id",
        "bulk_generator_id",
        "scheduled_date",
        "pickup_status",
        "actual_weight_kg",
        "contamination_flag",
    ])


def generate_bulk_generators_csv(page: BulkGeneratorReportPage) -> str:
    rows = [
        {
            "generator_id": str(row.generator_id),
            "generator_code": row.generator_code,
            "entity_name": row.entity_name,
            "city_id": str(row.city_id),
            "ward_id": str(row.ward_id),
            "zone_id": str(row.zone_id) if row.zone_id else "",
            "generator_type": row.generator_type,
            "compliance_status": row.compliance_status.value,
            "onboarding_status": row.onboarding_status,
            "is_active": row.is_active,
            "total_pickups": row.total_pickups,
            "completed_pickups": row.completed_pickups,
            "missed_pickups": row.missed_pickups,
            "total_picked_weight_kg": row.total_picked_weight_kg,
            "total_certificates": row.total_certificates,
            "certified_weight_kg": row.certified_weight_kg,
        }
        for row in page.rows
    ]
    return _csv_from_rows(rows, list(rows[0].keys()) if rows else [
        "generator_id",
        "generator_code",
        "entity_name",
        "city_id",
        "ward_id",
        "zone_id",
        "generator_type",
        "compliance_status",
        "onboarding_status",
        "is_active",
        "total_pickups",
        "completed_pickups",
        "missed_pickups",
        "total_picked_weight_kg",
        "total_certificates",
        "certified_weight_kg",
    ])


def generate_environmental_summaries_csv(page: EnvironmentalSummaryReportPage) -> str:
    rows = [
        {
            "summary_id": str(row.summary_id),
            "city_id": str(row.city_id),
            "ward_id": str(row.ward_id) if row.ward_id else "",
            "reporting_month": row.reporting_month,
            "reporting_year": row.reporting_year,
            "summary_status": row.summary_status,
            "total_collected_kg": row.total_collected_kg,
            "total_processed_kg": row.total_processed_kg,
            "total_landfilled_kg": row.total_landfilled_kg,
            "landfill_diversion_percent": row.landfill_diversion_percent,
            "avoided_emission_kgco2e": row.avoided_emission_kgco2e,
            "net_emission_kgco2e": row.net_emission_kgco2e,
            "generated_at": row.generated_at.isoformat(),
        }
        for row in page.rows
    ]
    return _csv_from_rows(rows, list(rows[0].keys()) if rows else [
        "summary_id",
        "city_id",
        "ward_id",
        "reporting_month",
        "reporting_year",
        "summary_status",
        "total_collected_kg",
        "total_processed_kg",
        "total_landfilled_kg",
        "landfill_diversion_percent",
        "avoided_emission_kgco2e",
        "net_emission_kgco2e",
        "generated_at",
    ])


def generate_carbon_ledger_csv(page: CarbonLedgerReportPage) -> str:
    rows = [
        {
            "entry_id": str(row.entry_id),
            "carbon_event_id": str(row.carbon_event_id),
            "city_id": str(row.city_id) if row.city_id else "",
            "ward_id": str(row.ward_id) if row.ward_id else "",
            "entry_type": row.entry_type,
            "verification_status": row.verification_status.value,
            "period_month": row.period_month,
            "period_year": row.period_year,
            "quantity_kgco2e": row.quantity_kgco2e,
            "recorded_at": row.recorded_at.isoformat(),
        }
        for row in page.rows
    ]
    return _csv_from_rows(rows, list(rows[0].keys()) if rows else [
        "entry_id",
        "carbon_event_id",
        "city_id",
        "ward_id",
        "entry_type",
        "verification_status",
        "period_month",
        "period_year",
        "quantity_kgco2e",
        "recorded_at",
    ])
