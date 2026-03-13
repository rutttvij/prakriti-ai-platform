from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.models.worker_profile import WorkerProfile
from app.schemas.worker_profile import WorkerProfileCreate
from app.services.operations_common import ensure_worker_user_role, validate_city_ward_zone


def create_worker_profile(db: Session, payload: WorkerProfileCreate, actor_id: UUID | None = None) -> WorkerProfile:
    existing_by_user = db.scalar(select(WorkerProfile).where(WorkerProfile.user_id == payload.user_id))
    if existing_by_user:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User already has worker profile")

    existing_by_code = db.scalar(select(WorkerProfile).where(WorkerProfile.employee_code == payload.employee_code))
    if existing_by_code:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Employee code already exists")

    ensure_worker_user_role(db, payload.user_id)
    validate_city_ward_zone(db, payload.city_id, payload.ward_id, payload.zone_id)

    worker = WorkerProfile(**payload.model_dump())
    if actor_id:
        worker.created_by = actor_id
        worker.updated_by = actor_id

    db.add(worker)
    db.commit()
    db.refresh(worker)
    return worker


def list_worker_profiles(
    db: Session,
    city_id: UUID | None = None,
    ward_id: UUID | None = None,
    zone_id: UUID | None = None,
    employment_status=None,
) -> list[WorkerProfile]:
    query: Select[tuple[WorkerProfile]] = select(WorkerProfile).order_by(WorkerProfile.created_at.desc())
    if city_id:
        query = query.where(WorkerProfile.city_id == city_id)
    if ward_id:
        query = query.where(WorkerProfile.ward_id == ward_id)
    if zone_id:
        query = query.where(WorkerProfile.zone_id == zone_id)
    if employment_status:
        query = query.where(WorkerProfile.employment_status == employment_status)
    return list(db.scalars(query).all())


def get_worker_profile(db: Session, worker_id: UUID) -> WorkerProfile:
    worker = db.get(WorkerProfile, worker_id)
    if not worker:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Worker profile not found")
    return worker
