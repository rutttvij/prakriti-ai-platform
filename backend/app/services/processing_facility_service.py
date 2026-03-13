from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.models.address import Address
from app.models.processing_facility import ProcessingFacility
from app.schemas.processing_facility import ProcessingFacilityCreate
from app.services.processing_lifecycle_common import validate_facility_geography


def create_processing_facility(db: Session, payload: ProcessingFacilityCreate, actor_id: UUID | None = None) -> ProcessingFacility:
    existing = db.scalar(select(ProcessingFacility).where(ProcessingFacility.facility_code == payload.facility_code))
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Facility code already exists")

    validate_facility_geography(db, payload.city_id, payload.ward_id, payload.zone_id)

    if payload.address_id:
        address = db.get(Address, payload.address_id)
        if not address:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found")

    facility = ProcessingFacility(**payload.model_dump())
    if actor_id:
        facility.created_by = actor_id
        facility.updated_by = actor_id

    db.add(facility)
    db.commit()
    db.refresh(facility)
    return facility


def list_processing_facilities(
    db: Session,
    city_id: UUID | None = None,
    ward_id: UUID | None = None,
    zone_id: UUID | None = None,
    facility_type=None,
    is_active: bool | None = None,
) -> list[ProcessingFacility]:
    query: Select[tuple[ProcessingFacility]] = select(ProcessingFacility).order_by(ProcessingFacility.created_at.desc())
    if city_id:
        query = query.where(ProcessingFacility.city_id == city_id)
    if ward_id:
        query = query.where(ProcessingFacility.ward_id == ward_id)
    if zone_id:
        query = query.where(ProcessingFacility.zone_id == zone_id)
    if facility_type:
        query = query.where(ProcessingFacility.facility_type == facility_type)
    if is_active is not None:
        query = query.where(ProcessingFacility.is_active == is_active)
    return list(db.scalars(query).all())


def get_processing_facility(db: Session, facility_id: UUID) -> ProcessingFacility:
    facility = db.get(ProcessingFacility, facility_id)
    if not facility:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Processing facility not found")
    return facility
