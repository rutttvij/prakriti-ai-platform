from datetime import datetime
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.models.pickup_log import PickupLog
from app.models.worker_profile import WorkerProfile
from app.schemas.pickup_log import PickupLogCreate
from app.services.operations_common import get_pickup_task, now_utc


def create_pickup_log(db: Session, payload: PickupLogCreate, actor_id: UUID | None = None) -> PickupLog:
    task = get_pickup_task(db, payload.pickup_task_id)
    worker = db.get(WorkerProfile, payload.worker_profile_id)
    if not worker:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Worker profile not found")

    if task.assigned_worker_id and task.assigned_worker_id != worker.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Log worker is not assigned to this task")

    log = PickupLog(
        pickup_task_id=payload.pickup_task_id,
        worker_profile_id=payload.worker_profile_id,
        event_type=payload.event_type,
        latitude=payload.latitude,
        longitude=payload.longitude,
        event_at=payload.event_at or now_utc(),
        notes=payload.notes,
        weight_kg=payload.weight_kg,
        photo_url=payload.photo_url,
    )
    if actor_id:
        log.created_by = actor_id
        log.updated_by = actor_id

    db.add(log)
    db.commit()
    db.refresh(log)
    return log


def list_pickup_logs(
    db: Session,
    pickup_task_id: UUID | None = None,
    worker_profile_id: UUID | None = None,
    event_type=None,
    event_at_from: datetime | None = None,
    event_at_to: datetime | None = None,
) -> list[PickupLog]:
    query: Select[tuple[PickupLog]] = select(PickupLog).order_by(PickupLog.event_at.desc())
    if pickup_task_id:
        query = query.where(PickupLog.pickup_task_id == pickup_task_id)
    if worker_profile_id:
        query = query.where(PickupLog.worker_profile_id == worker_profile_id)
    if event_type:
        query = query.where(PickupLog.event_type == event_type)
    if event_at_from:
        query = query.where(PickupLog.event_at >= event_at_from)
    if event_at_to:
        query = query.where(PickupLog.event_at <= event_at_to)
    return list(db.scalars(query).all())


def get_pickup_log(db: Session, pickup_log_id: UUID) -> PickupLog:
    log = db.get(PickupLog, pickup_log_id)
    if not log:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pickup log not found")
    return log
