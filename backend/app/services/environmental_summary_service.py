from datetime import datetime
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import Select, extract, func, select
from sqlalchemy.orm import Session

from app.models.carbon_event import CarbonEvent
from app.models.collected_batch import CollectedBatch
from app.models.environmental_summary import EnvironmentalSummary
from app.models.landfill_record import LandfillRecord
from app.models.processing_facility import ProcessingFacility
from app.models.processing_record import ProcessingRecord
from app.schemas.environmental_summary import EnvironmentalSummaryGenerateRequest
from app.services.operations_common import validate_city_ward_zone


def generate_environmental_summary(
    db: Session,
    payload: EnvironmentalSummaryGenerateRequest,
    actor_id: UUID | None = None,
) -> EnvironmentalSummary:
    validate_city_ward_zone(db, payload.city_id, payload.ward_id, None)

    month = payload.reporting_month
    year = payload.reporting_year

    batch_query = select(func.coalesce(func.sum(CollectedBatch.total_weight_kg), 0.0)).where(
        CollectedBatch.city_id == payload.city_id,
        extract("month", CollectedBatch.created_date) == month,
        extract("year", CollectedBatch.created_date) == year,
    )
    if payload.ward_id:
        batch_query = batch_query.where(CollectedBatch.ward_id == payload.ward_id)
    total_collected = float(db.scalar(batch_query) or 0.0)

    processing_query = select(
        func.coalesce(func.sum(ProcessingRecord.input_weight_kg), 0.0),
        func.coalesce(
            func.sum(
                (func.coalesce(ProcessingRecord.recyclable_plastic_kg, 0.0)
                 + func.coalesce(ProcessingRecord.recyclable_metal_kg, 0.0)
                 + func.coalesce(ProcessingRecord.recyclable_paper_kg, 0.0)
                 + func.coalesce(ProcessingRecord.recyclable_glass_kg, 0.0))
            ),
            0.0,
        ),
        func.coalesce(func.sum(ProcessingRecord.organic_compost_kg), 0.0),
    ).join(CollectedBatch, CollectedBatch.id == ProcessingRecord.batch_id).where(
        CollectedBatch.city_id == payload.city_id,
        extract("month", ProcessingRecord.processed_at) == month,
        extract("year", ProcessingRecord.processed_at) == year,
    )
    if payload.ward_id:
        processing_query = processing_query.where(CollectedBatch.ward_id == payload.ward_id)
    total_processed, total_recycled, total_composted = db.execute(processing_query).one()

    landfill_query = select(func.coalesce(func.sum(LandfillRecord.waste_weight_kg), 0.0)).join(
        ProcessingFacility,
        ProcessingFacility.id == LandfillRecord.facility_id,
    ).where(
        ProcessingFacility.city_id == payload.city_id,
        extract("month", LandfillRecord.disposal_date) == month,
        extract("year", LandfillRecord.disposal_date) == year,
    )
    if payload.ward_id:
        landfill_query = landfill_query.where(ProcessingFacility.ward_id == payload.ward_id)
    total_landfilled = float(db.scalar(landfill_query) or 0.0)

    events = list(
        db.scalars(
            select(CarbonEvent).where(
                extract("month", CarbonEvent.event_date) == month,
                extract("year", CarbonEvent.event_date) == year,
            )
        ).all()
    )

    gross = avoided = net = 0.0
    for event in events:
        city_id = ward_id = None
        if event.batch:
            city_id = event.batch.city_id
            ward_id = event.batch.ward_id
        elif event.facility:
            city_id = event.facility.city_id
            ward_id = event.facility.ward_id
        elif event.processing_record:
            city_id = event.processing_record.batch.city_id
            ward_id = event.processing_record.batch.ward_id
        elif event.landfill_record:
            city_id = event.landfill_record.facility.city_id
            ward_id = event.landfill_record.facility.ward_id
        elif event.recovery_certificate:
            city_id = event.recovery_certificate.batch.city_id
            ward_id = event.recovery_certificate.batch.ward_id

        if city_id != payload.city_id:
            continue
        if payload.ward_id and ward_id != payload.ward_id:
            continue

        gross += float(event.gross_emission_kgco2e or 0.0)
        avoided += float(event.avoided_emission_kgco2e or 0.0)
        net += float(event.net_emission_kgco2e or 0.0)

    diversion = None
    if total_collected > 0:
        diversion = max(0.0, min(100.0, ((total_collected - total_landfilled) / total_collected) * 100.0))

    existing = db.scalar(
        select(EnvironmentalSummary).where(
            EnvironmentalSummary.city_id == payload.city_id,
            EnvironmentalSummary.ward_id == payload.ward_id,
            EnvironmentalSummary.reporting_month == month,
            EnvironmentalSummary.reporting_year == year,
        )
    )

    if existing:
        summary = existing
        summary.updated_by = actor_id
    else:
        summary = EnvironmentalSummary(
            city_id=payload.city_id,
            ward_id=payload.ward_id,
            reporting_month=month,
            reporting_year=year,
        )
        if actor_id:
            summary.created_by = actor_id
            summary.updated_by = actor_id
        db.add(summary)

    summary.total_collected_kg = total_collected
    summary.total_processed_kg = float(total_processed or 0.0)
    summary.total_recycled_kg = float(total_recycled or 0.0)
    summary.total_composted_kg = float(total_composted or 0.0)
    summary.total_landfilled_kg = total_landfilled
    summary.landfill_diversion_percent = diversion
    summary.gross_emission_kgco2e = gross
    summary.avoided_emission_kgco2e = avoided
    summary.net_emission_kgco2e = net
    summary.summary_status = payload.summary_status
    summary.generated_at = datetime.utcnow()

    db.commit()
    db.refresh(summary)
    return summary


def list_environmental_summaries(
    db: Session,
    city_id: UUID | None = None,
    ward_id: UUID | None = None,
    reporting_month: int | None = None,
    reporting_year: int | None = None,
    summary_status=None,
) -> list[EnvironmentalSummary]:
    query: Select[tuple[EnvironmentalSummary]] = select(EnvironmentalSummary).order_by(
        EnvironmentalSummary.reporting_year.desc(),
        EnvironmentalSummary.reporting_month.desc(),
        EnvironmentalSummary.created_at.desc(),
    )
    if city_id:
        query = query.where(EnvironmentalSummary.city_id == city_id)
    if ward_id:
        query = query.where(EnvironmentalSummary.ward_id == ward_id)
    if reporting_month:
        query = query.where(EnvironmentalSummary.reporting_month == reporting_month)
    if reporting_year:
        query = query.where(EnvironmentalSummary.reporting_year == reporting_year)
    if summary_status:
        query = query.where(EnvironmentalSummary.summary_status == summary_status)
    return list(db.scalars(query).all())


def get_environmental_summary(db: Session, summary_id: UUID) -> EnvironmentalSummary:
    summary = db.get(EnvironmentalSummary, summary_id)
    if not summary:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Environmental summary not found")
    return summary
