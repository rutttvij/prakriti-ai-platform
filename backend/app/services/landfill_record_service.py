from datetime import date
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.models.landfill_record import LandfillRecord
from app.models.vehicle import Vehicle
from app.schemas.landfill_record import LandfillRecordCreate
from app.services.processing_lifecycle_common import get_batch, get_facility


def create_landfill_record(db: Session, payload: LandfillRecordCreate, actor_id: UUID | None = None) -> LandfillRecord:
    if payload.waste_weight_kg <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="waste_weight_kg must be positive")

    facility = get_facility(db, payload.facility_id)

    if payload.batch_id:
        batch = get_batch(db, payload.batch_id)
        if batch.city_id != facility.city_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Batch city does not match facility city")

    if payload.transported_by_vehicle_id:
        vehicle = db.get(Vehicle, payload.transported_by_vehicle_id)
        if not vehicle:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")

    record = LandfillRecord(**payload.model_dump())
    if actor_id:
        record.created_by = actor_id
        record.updated_by = actor_id

    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def list_landfill_records(
    db: Session,
    facility_id: UUID | None = None,
    batch_id: UUID | None = None,
    disposal_date: date | None = None,
    disposal_method=None,
) -> list[LandfillRecord]:
    query: Select[tuple[LandfillRecord]] = select(LandfillRecord).order_by(LandfillRecord.disposal_date.desc(), LandfillRecord.created_at.desc())
    if facility_id:
        query = query.where(LandfillRecord.facility_id == facility_id)
    if batch_id:
        query = query.where(LandfillRecord.batch_id == batch_id)
    if disposal_date:
        query = query.where(LandfillRecord.disposal_date == disposal_date)
    if disposal_method:
        query = query.where(LandfillRecord.disposal_method == disposal_method)
    return list(db.scalars(query).all())


def get_landfill_record(db: Session, landfill_record_id: UUID) -> LandfillRecord:
    record = db.get(LandfillRecord, landfill_record_id)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Landfill record not found")
    return record
