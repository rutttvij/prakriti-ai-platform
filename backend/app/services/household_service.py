from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.models.enums import AssignedEntityType, OnboardingStatus
from app.models.household import Household
from app.models.qr_code_tag import QRCodeTag
from app.schemas.household import HouseholdCreate
from app.services.qr_tag_service import assign_qr_tag
from app.services.source_registry_common import validate_address_if_present, validate_location_hierarchy


def create_household(db: Session, payload: HouseholdCreate, actor_id: UUID | None = None) -> Household:
    existing = db.scalar(select(Household).where(Household.household_code == payload.household_code))
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Household code already exists")

    validate_location_hierarchy(
        db,
        city_id=payload.city_id,
        ward_id=payload.ward_id,
        zone_id=payload.zone_id,
        organization_id=payload.organization_id,
    )
    validate_address_if_present(db, payload.address_id)

    if payload.qr_tag_id:
        tag = db.get(QRCodeTag, payload.qr_tag_id)
        if not tag:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="QR tag not found")
        if tag.assigned_entity_id:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="QR tag already assigned")

    household = Household(**payload.model_dump())
    if actor_id:
        household.created_by = actor_id
        household.updated_by = actor_id

    db.add(household)
    db.flush()

    if payload.qr_tag_id:
        assign_qr_tag(db, payload.qr_tag_id, AssignedEntityType.HOUSEHOLD, household.id, actor_id)
    else:
        db.commit()

    db.refresh(household)
    return household


def list_households(
    db: Session,
    city_id: UUID | None = None,
    ward_id: UUID | None = None,
    zone_id: UUID | None = None,
    onboarding_status: OnboardingStatus | None = None,
    is_active: bool | None = None,
) -> list[Household]:
    query: Select[tuple[Household]] = select(Household).order_by(Household.created_at.desc())
    if city_id:
        query = query.where(Household.city_id == city_id)
    if ward_id:
        query = query.where(Household.ward_id == ward_id)
    if zone_id:
        query = query.where(Household.zone_id == zone_id)
    if onboarding_status:
        query = query.where(Household.onboarding_status == onboarding_status)
    if is_active is not None:
        query = query.where(Household.is_active == is_active)
    return list(db.scalars(query).all())


def get_household(db: Session, household_id: UUID) -> Household:
    household = db.get(Household, household_id)
    if not household:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Household not found")
    return household
