from datetime import datetime
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.models.enums import BatchStatus, ProcessingStatus
from app.models.processing_record import ProcessingRecord
from app.schemas.processing_record import ProcessingRecordCreate
from app.services.processing_lifecycle_common import (
    get_batch,
    get_facility,
    validate_facility_batch_compatibility,
    validate_processing_output_sum,
    validate_processing_weight_bounds,
)


def create_processing_record(db: Session, payload: ProcessingRecordCreate, actor_id: UUID | None = None) -> ProcessingRecord:
    batch = get_batch(db, payload.batch_id)
    facility = get_facility(db, payload.facility_id)

    validate_facility_batch_compatibility(facility, batch)
    validate_processing_weight_bounds(db, batch, payload.input_weight_kg)
    validate_processing_output_sum(
        payload.input_weight_kg,
        payload.output_recovered_kg,
        payload.output_rejected_kg,
        payload.residue_to_landfill_kg,
    )

    record = ProcessingRecord(**payload.model_dump())
    if actor_id:
        record.created_by = actor_id
        record.updated_by = actor_id

    if payload.processing_status in {ProcessingStatus.INITIATED, ProcessingStatus.PARTIAL}:
        batch.batch_status = BatchStatus.PROCESSING
    if payload.processing_status == ProcessingStatus.COMPLETED:
        batch.batch_status = BatchStatus.PROCESSED
    if actor_id:
        batch.updated_by = actor_id

    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def list_processing_records(
    db: Session,
    facility_id: UUID | None = None,
    batch_id: UUID | None = None,
    process_type=None,
    processing_status=None,
    processed_at_from: datetime | None = None,
    processed_at_to: datetime | None = None,
) -> list[ProcessingRecord]:
    query: Select[tuple[ProcessingRecord]] = select(ProcessingRecord).order_by(ProcessingRecord.processed_at.desc())
    if facility_id:
        query = query.where(ProcessingRecord.facility_id == facility_id)
    if batch_id:
        query = query.where(ProcessingRecord.batch_id == batch_id)
    if process_type:
        query = query.where(ProcessingRecord.process_type == process_type)
    if processing_status:
        query = query.where(ProcessingRecord.processing_status == processing_status)
    if processed_at_from:
        query = query.where(ProcessingRecord.processed_at >= processed_at_from)
    if processed_at_to:
        query = query.where(ProcessingRecord.processed_at <= processed_at_to)
    return list(db.scalars(query).all())


def get_processing_record(db: Session, processing_record_id: UUID) -> ProcessingRecord:
    record = db.get(ProcessingRecord, processing_record_id)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Processing record not found")
    return record
