from datetime import date
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.models.carbon_event import CarbonEvent
from app.models.carbon_project import CarbonProject
from app.models.collected_batch import CollectedBatch
from app.models.enums import CarbonCalculationStatus
from app.models.landfill_record import LandfillRecord
from app.models.processing_facility import ProcessingFacility
from app.models.processing_record import ProcessingRecord
from app.models.recovery_certificate import RecoveryCertificate
from app.schemas.carbon_event import CarbonEventCreate
from app.services.carbon_accounting_common import (
    calculate_emission_values,
    derive_scope_from_carbon_event,
    derive_scope_from_event_links,
    get_emission_factor,
    lookup_emission_factor,
    validate_factor_active_for_date,
)


def _load_linked_entities(db: Session, payload: CarbonEventCreate) -> tuple[
    CarbonProject | None,
    CollectedBatch | None,
    ProcessingFacility | None,
    ProcessingRecord | None,
    LandfillRecord | None,
    RecoveryCertificate | None,
]:
    project = db.get(CarbonProject, payload.carbon_project_id) if payload.carbon_project_id else None
    batch = db.get(CollectedBatch, payload.batch_id) if payload.batch_id else None
    facility = db.get(ProcessingFacility, payload.facility_id) if payload.facility_id else None
    processing_record = db.get(ProcessingRecord, payload.processing_record_id) if payload.processing_record_id else None
    landfill_record = db.get(LandfillRecord, payload.landfill_record_id) if payload.landfill_record_id else None
    recovery_certificate = db.get(RecoveryCertificate, payload.recovery_certificate_id) if payload.recovery_certificate_id else None

    if payload.carbon_project_id and not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Carbon project not found")
    if payload.batch_id and not batch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found")
    if payload.facility_id and not facility:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Facility not found")
    if payload.processing_record_id and not processing_record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Processing record not found")
    if payload.landfill_record_id and not landfill_record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Landfill record not found")
    if payload.recovery_certificate_id and not recovery_certificate:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recovery certificate not found")

    return project, batch, facility, processing_record, landfill_record, recovery_certificate


def _derive_quantity_waste_and_process(
    payload: CarbonEventCreate,
    processing_record: ProcessingRecord | None,
    landfill_record: LandfillRecord | None,
    recovery_certificate: RecoveryCertificate | None,
    batch: CollectedBatch | None,
) -> tuple[float, object, object | None]:
    quantity = payload.quantity_kg
    waste_type = payload.waste_type
    process_type = payload.process_type

    if quantity is None:
        if landfill_record:
            quantity = landfill_record.waste_weight_kg
        elif processing_record:
            quantity = processing_record.input_weight_kg
        elif recovery_certificate:
            quantity = recovery_certificate.certified_weight_kg
        elif batch and batch.total_weight_kg is not None:
            quantity = batch.total_weight_kg

    if waste_type is None and recovery_certificate:
        waste_type = recovery_certificate.waste_type

    if process_type is None and processing_record:
        process_type = processing_record.process_type

    if quantity is None or quantity <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="quantity_kg must be provided or derivable and positive")
    if waste_type is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="waste_type must be provided or derivable")

    return quantity, waste_type, process_type


def create_carbon_event(db: Session, payload: CarbonEventCreate, actor_id: UUID | None = None) -> CarbonEvent:
    existing = db.scalar(select(CarbonEvent).where(CarbonEvent.event_code == payload.event_code))
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Event code already exists")

    _, batch, facility, processing_record, landfill_record, recovery_certificate = _load_linked_entities(db, payload)

    quantity, waste_type, process_type = _derive_quantity_waste_and_process(
        payload,
        processing_record,
        landfill_record,
        recovery_certificate,
        batch,
    )

    city_id, ward_id, _ = derive_scope_from_event_links(
        batch=batch,
        facility=facility,
        processing_record=processing_record,
        landfill_record=landfill_record,
        recovery_certificate=recovery_certificate,
    )

    factor = None
    factor_value = payload.factor_value

    if payload.factor_id:
        factor = get_emission_factor(db, payload.factor_id)
        validate_factor_active_for_date(factor, payload.event_date)
        factor_value = factor.factor_value
    elif factor_value is None:
        geography_candidates = []
        if ward_id:
            geography_candidates.append(f"ward:{ward_id}")
        if city_id:
            geography_candidates.append(f"city:{city_id}")
        factor = lookup_emission_factor(
            db,
            waste_type=waste_type,
            process_type=process_type,
            event_date=payload.event_date,
            geography_candidates=geography_candidates,
        )
        if factor:
            factor_value = factor.factor_value

    if factor_value is None:
        # manual fallback only when caller explicitly sends computed values
        if payload.gross_emission_kgco2e is None and payload.avoided_emission_kgco2e is None and payload.net_emission_kgco2e is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No applicable factor found; provide factor_value or computed emissions")
        gross = payload.gross_emission_kgco2e or 0.0
        avoided = payload.avoided_emission_kgco2e or 0.0
        net = payload.net_emission_kgco2e if payload.net_emission_kgco2e is not None else (gross - avoided)
        calc_status = CarbonCalculationStatus.MANUAL
    else:
        gross, avoided, net = calculate_emission_values(payload.event_type, quantity, factor_value)
        calc_status = CarbonCalculationStatus.CALCULATED

    event = CarbonEvent(
        carbon_project_id=payload.carbon_project_id,
        event_code=payload.event_code,
        source_entity_type=payload.source_entity_type,
        source_entity_id=payload.source_entity_id,
        batch_id=payload.batch_id,
        facility_id=payload.facility_id,
        processing_record_id=payload.processing_record_id,
        landfill_record_id=payload.landfill_record_id,
        recovery_certificate_id=payload.recovery_certificate_id,
        event_type=payload.event_type,
        waste_type=waste_type,
        quantity_kg=quantity,
        factor_id=factor.id if factor else payload.factor_id,
        factor_value=factor_value,
        gross_emission_kgco2e=gross,
        avoided_emission_kgco2e=avoided,
        net_emission_kgco2e=net,
        event_date=payload.event_date,
        methodology_snapshot=payload.methodology_snapshot,
        calculation_status=calc_status,
        notes=payload.notes,
    )
    if actor_id:
        event.created_by = actor_id
        event.updated_by = actor_id

    db.add(event)
    db.commit()
    db.refresh(event)
    return event


def list_carbon_events(
    db: Session,
    city_id: UUID | None = None,
    ward_id: UUID | None = None,
    batch_id: UUID | None = None,
    facility_id: UUID | None = None,
    event_type=None,
    waste_type=None,
    calculation_status=None,
    event_date_from: date | None = None,
    event_date_to: date | None = None,
) -> list[CarbonEvent]:
    query: Select[tuple[CarbonEvent]] = select(CarbonEvent).order_by(CarbonEvent.event_date.desc(), CarbonEvent.created_at.desc())
    if batch_id:
        query = query.where(CarbonEvent.batch_id == batch_id)
    if facility_id:
        query = query.where(CarbonEvent.facility_id == facility_id)
    if event_type:
        query = query.where(CarbonEvent.event_type == event_type)
    if waste_type:
        query = query.where(CarbonEvent.waste_type == waste_type)
    if calculation_status:
        query = query.where(CarbonEvent.calculation_status == calculation_status)
    if event_date_from:
        query = query.where(CarbonEvent.event_date >= event_date_from)
    if event_date_to:
        query = query.where(CarbonEvent.event_date <= event_date_to)

    events = list(db.scalars(query).all())
    if city_id or ward_id:
        filtered = []
        for event in events:
            ev_city_id, ev_ward_id, _ = derive_scope_from_carbon_event(event)
            if city_id and ev_city_id != city_id:
                continue
            if ward_id and ev_ward_id != ward_id:
                continue
            filtered.append(event)
        return filtered

    return events


def get_carbon_event(db: Session, event_id: UUID) -> CarbonEvent:
    event = db.get(CarbonEvent, event_id)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Carbon event not found")
    return event
