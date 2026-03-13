from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.city import City
from app.models.ward import Ward
from app.schemas.ward import WardCreate


def create_ward(db: Session, payload: WardCreate, actor_id: UUID | None = None) -> Ward:
    city = db.get(City, payload.city_id)
    if not city:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="City not found")

    duplicate = db.scalar(select(Ward).where(Ward.city_id == payload.city_id, Ward.code == payload.code))
    if duplicate:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Ward code already exists in city")

    ward = Ward(city_id=payload.city_id, name=payload.name, code=payload.code, is_active=payload.is_active)
    if actor_id:
        ward.created_by = actor_id
        ward.updated_by = actor_id

    db.add(ward)
    db.commit()
    db.refresh(ward)
    return ward


def list_wards(db: Session, city_id: UUID | None = None, ward_id: UUID | None = None) -> list[Ward]:
    query = select(Ward).order_by(Ward.created_at.desc())
    if city_id:
        query = query.where(Ward.city_id == city_id)
    if ward_id:
        query = query.where(Ward.id == ward_id)
    return list(db.scalars(query).all())
