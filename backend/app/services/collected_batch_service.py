from datetime import date
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.models.collected_batch import CollectedBatch
from app.schemas.collected_batch import CollectedBatchCreate
from app.services.operations_common import (
    validate_city_ward_zone,
    validate_route_scope,
    validate_vehicle_assignment,
    validate_worker_assignment,
)


def create_collected_batch(db: Session, payload: CollectedBatchCreate, actor_id: UUID | None = None) -> CollectedBatch:
    existing = db.scalar(select(CollectedBatch).where(CollectedBatch.batch_code == payload.batch_code))
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Batch code already exists")

    validate_city_ward_zone(db, payload.city_id, payload.ward_id, payload.zone_id)
    validate_vehicle_assignment(db, payload.assigned_vehicle_id, payload.city_id, payload.ward_id)
    validate_worker_assignment(db, payload.assigned_worker_id, payload.city_id, payload.ward_id)
    validate_route_scope(db, payload.origin_route_id, payload.city_id, payload.ward_id, payload.zone_id)

    batch = CollectedBatch(**payload.model_dump())
    if actor_id:
        batch.created_by = actor_id
        batch.updated_by = actor_id

    db.add(batch)
    db.commit()
    db.refresh(batch)
    return batch


def list_collected_batches(
    db: Session,
    city_id: UUID | None = None,
    ward_id: UUID | None = None,
    zone_id: UUID | None = None,
    batch_status=None,
    created_date: date | None = None,
) -> list[CollectedBatch]:
    query: Select[tuple[CollectedBatch]] = select(CollectedBatch).order_by(CollectedBatch.created_date.desc(), CollectedBatch.created_at.desc())
    if city_id:
        query = query.where(CollectedBatch.city_id == city_id)
    if ward_id:
        query = query.where(CollectedBatch.ward_id == ward_id)
    if zone_id:
        query = query.where(CollectedBatch.zone_id == zone_id)
    if batch_status:
        query = query.where(CollectedBatch.batch_status == batch_status)
    if created_date:
        query = query.where(CollectedBatch.created_date == created_date)
    return list(db.scalars(query).all())


def get_collected_batch(db: Session, batch_id: UUID) -> CollectedBatch:
    batch = db.get(CollectedBatch, batch_id)
    if not batch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Collected batch not found")
    return batch
