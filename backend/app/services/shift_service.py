from datetime import date
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.models.shift import Shift
from app.models.user import User
from app.schemas.shift import ShiftCreate
from app.services.operations_common import validate_city_ward_zone


def create_shift(db: Session, payload: ShiftCreate, actor_id: UUID | None = None) -> Shift:
    validate_city_ward_zone(db, payload.city_id, payload.ward_id, payload.zone_id)

    if payload.end_time <= payload.start_time:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Shift end_time must be after start_time")

    if payload.supervisor_user_id:
        supervisor = db.get(User, payload.supervisor_user_id)
        if not supervisor:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Supervisor user not found")
        if supervisor.city_id and supervisor.city_id != payload.city_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Supervisor city does not match shift city")
        if payload.ward_id and supervisor.ward_id and supervisor.ward_id != payload.ward_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Supervisor ward does not match shift ward")

    shift = Shift(**payload.model_dump())
    if actor_id:
        shift.created_by = actor_id
        shift.updated_by = actor_id

    db.add(shift)
    db.commit()
    db.refresh(shift)
    return shift


def list_shifts(
    db: Session,
    city_id: UUID | None = None,
    ward_id: UUID | None = None,
    zone_id: UUID | None = None,
    shift_date: date | None = None,
) -> list[Shift]:
    query: Select[tuple[Shift]] = select(Shift).order_by(Shift.shift_date.desc(), Shift.created_at.desc())
    if city_id:
        query = query.where(Shift.city_id == city_id)
    if ward_id:
        query = query.where(Shift.ward_id == ward_id)
    if zone_id:
        query = query.where(Shift.zone_id == zone_id)
    if shift_date:
        query = query.where(Shift.shift_date == shift_date)
    return list(db.scalars(query).all())


def get_shift(db: Session, shift_id: UUID) -> Shift:
    shift = db.get(Shift, shift_id)
    if not shift:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shift not found")
    return shift
