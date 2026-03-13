from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.models.bulk_waste_generator import BulkWasteGenerator
from app.models.enums import AssignedEntityType, ComplianceStatus, GeneratorType, OnboardingStatus
from app.models.qr_code_tag import QRCodeTag
from app.schemas.bulk_generator import BulkWasteGeneratorCreate
from app.services.qr_tag_service import assign_qr_tag
from app.services.source_registry_common import validate_address_if_present, validate_location_hierarchy


def create_bulk_generator(db: Session, payload: BulkWasteGeneratorCreate, actor_id: UUID | None = None) -> BulkWasteGenerator:
    existing = db.scalar(select(BulkWasteGenerator).where(BulkWasteGenerator.generator_code == payload.generator_code))
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Generator code already exists")

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

    generator = BulkWasteGenerator(**payload.model_dump())
    if actor_id:
        generator.created_by = actor_id
        generator.updated_by = actor_id

    db.add(generator)
    db.flush()

    if payload.qr_tag_id:
        assign_qr_tag(db, payload.qr_tag_id, AssignedEntityType.BULK_GENERATOR, generator.id, actor_id)
    else:
        db.commit()

    db.refresh(generator)
    return generator


def list_bulk_generators(
    db: Session,
    city_id: UUID | None = None,
    ward_id: UUID | None = None,
    zone_id: UUID | None = None,
    generator_type: GeneratorType | None = None,
    compliance_status: ComplianceStatus | None = None,
    onboarding_status: OnboardingStatus | None = None,
    is_active: bool | None = None,
) -> list[BulkWasteGenerator]:
    query: Select[tuple[BulkWasteGenerator]] = select(BulkWasteGenerator).order_by(BulkWasteGenerator.created_at.desc())
    if city_id:
        query = query.where(BulkWasteGenerator.city_id == city_id)
    if ward_id:
        query = query.where(BulkWasteGenerator.ward_id == ward_id)
    if zone_id:
        query = query.where(BulkWasteGenerator.zone_id == zone_id)
    if generator_type:
        query = query.where(BulkWasteGenerator.generator_type == generator_type)
    if compliance_status:
        query = query.where(BulkWasteGenerator.compliance_status == compliance_status)
    if onboarding_status:
        query = query.where(BulkWasteGenerator.onboarding_status == onboarding_status)
    if is_active is not None:
        query = query.where(BulkWasteGenerator.is_active == is_active)
    return list(db.scalars(query).all())


def get_bulk_generator(db: Session, generator_id: UUID) -> BulkWasteGenerator:
    generator = db.get(BulkWasteGenerator, generator_id)
    if not generator:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bulk generator not found")
    return generator
