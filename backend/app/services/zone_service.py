from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.ward import Ward
from app.models.zone import Zone
from app.schemas.zone import ZoneCreate


def create_zone(db: Session, payload: ZoneCreate, actor_id: UUID | None = None) -> Zone:
    ward = db.get(Ward, payload.ward_id)
    if not ward:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ward not found")

    duplicate = db.scalar(select(Zone).where(Zone.ward_id == payload.ward_id, Zone.code == payload.code))
    if duplicate:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Zone code already exists in ward")

    zone = Zone(ward_id=payload.ward_id, name=payload.name, code=payload.code, is_active=payload.is_active)
    if actor_id:
        zone.created_by = actor_id
        zone.updated_by = actor_id

    db.add(zone)
    db.commit()
    db.refresh(zone)
    return zone


def list_zones(db: Session, ward_id: UUID | None = None, ward_ids: list[UUID] | None = None) -> list[Zone]:
    query = select(Zone).order_by(Zone.created_at.desc())
    if ward_id:
        query = query.where(Zone.ward_id == ward_id)
    if ward_ids:
        query = query.where(Zone.ward_id.in_(ward_ids))
    return list(db.scalars(query).all())
