from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.city import City
from app.models.organization import Organization
from app.schemas.city import CityCreate


def create_city(db: Session, payload: CityCreate, actor_id: UUID | None = None) -> City:
    organization = db.get(Organization, payload.organization_id)
    if not organization:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")

    duplicate = db.scalar(
        select(City).where(City.organization_id == payload.organization_id, City.name == payload.name)
    )
    if duplicate:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="City already exists in organization")

    city = City(
        organization_id=payload.organization_id,
        name=payload.name,
        state=payload.state,
        country=payload.country,
        is_active=payload.is_active,
    )
    if actor_id:
        city.created_by = actor_id
        city.updated_by = actor_id

    db.add(city)
    db.commit()
    db.refresh(city)
    return city


def list_cities(db: Session, organization_id: UUID | None = None, city_id: UUID | None = None) -> list[City]:
    query = select(City).order_by(City.created_at.desc())
    if organization_id:
        query = query.where(City.organization_id == organization_id)
    if city_id:
        query = query.where(City.id == city_id)
    return list(db.scalars(query).all())
