from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.models.vehicle import Vehicle
from app.schemas.vehicle import VehicleCreate
from app.services.operations_common import validate_city_ward_zone


def create_vehicle(db: Session, payload: VehicleCreate, actor_id: UUID | None = None) -> Vehicle:
    existing = db.scalar(select(Vehicle).where(Vehicle.registration_number == payload.registration_number))
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Vehicle registration number already exists")

    validate_city_ward_zone(db, payload.city_id, payload.ward_id, payload.zone_id)

    vehicle = Vehicle(**payload.model_dump())
    if actor_id:
        vehicle.created_by = actor_id
        vehicle.updated_by = actor_id

    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return vehicle


def list_vehicles(
    db: Session,
    city_id: UUID | None = None,
    ward_id: UUID | None = None,
    zone_id: UUID | None = None,
    vehicle_type=None,
    ownership_type=None,
) -> list[Vehicle]:
    query: Select[tuple[Vehicle]] = select(Vehicle).order_by(Vehicle.created_at.desc())
    if city_id:
        query = query.where(Vehicle.city_id == city_id)
    if ward_id:
        query = query.where(Vehicle.ward_id == ward_id)
    if zone_id:
        query = query.where(Vehicle.zone_id == zone_id)
    if vehicle_type:
        query = query.where(Vehicle.vehicle_type == vehicle_type)
    if ownership_type:
        query = query.where(Vehicle.ownership_type == ownership_type)
    return list(db.scalars(query).all())


def get_vehicle(db: Session, vehicle_id: UUID) -> Vehicle:
    vehicle = db.get(Vehicle, vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")
    return vehicle
