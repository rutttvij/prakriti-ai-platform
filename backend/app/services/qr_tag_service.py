from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.bulk_waste_generator import BulkWasteGenerator
from app.models.enums import AssignedEntityType, QRTagType
from app.models.household import Household
from app.models.qr_code_tag import QRCodeTag
from app.schemas.qr_tag import QRTagCreate


def create_qr_tag(db: Session, payload: QRTagCreate, actor_id=None) -> QRCodeTag:
    existing = db.scalar(select(QRCodeTag).where(QRCodeTag.code == payload.code))
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="QR code already exists")

    tag = QRCodeTag(**payload.model_dump())
    if actor_id:
        tag.created_by = actor_id
        tag.updated_by = actor_id

    db.add(tag)
    db.commit()
    db.refresh(tag)
    return tag


def list_qr_tags(db: Session, is_active: bool | None = None) -> list[QRCodeTag]:
    query = select(QRCodeTag).order_by(QRCodeTag.created_at.desc())
    if is_active is not None:
        query = query.where(QRCodeTag.is_active == is_active)
    return list(db.scalars(query).all())


def get_assignable_entity(db: Session, entity_type: AssignedEntityType, entity_id: UUID) -> Household | BulkWasteGenerator:
    if entity_type == AssignedEntityType.HOUSEHOLD:
        entity = db.get(Household, entity_id)
        if not entity:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Household not found")
        return entity

    entity = db.get(BulkWasteGenerator, entity_id)
    if not entity:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bulk generator not found")
    return entity


def assign_qr_tag(
    db: Session,
    tag_id: UUID,
    entity_type: AssignedEntityType,
    entity_id: UUID,
    actor_id=None,
) -> QRCodeTag:
    tag = db.get(QRCodeTag, tag_id)
    if not tag:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="QR tag not found")
    if not tag.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="QR tag is inactive")

    entity = get_assignable_entity(db, entity_type, entity_id)

    if entity_type == AssignedEntityType.HOUSEHOLD and tag.tag_type not in {QRTagType.HOUSEHOLD, QRTagType.GENERIC}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="QR tag type incompatible with household")
    if entity_type == AssignedEntityType.BULK_GENERATOR and tag.tag_type not in {QRTagType.BULK_GENERATOR, QRTagType.GENERIC}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="QR tag type incompatible with bulk generator")

    if tag.assigned_entity_id and (tag.assigned_entity_id != entity_id or tag.assigned_entity_type != entity_type):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="QR tag already assigned")

    existing_qr_id = entity.qr_tag_id
    if existing_qr_id and existing_qr_id != tag.id:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Entity already has a different QR tag")

    entity.qr_tag_id = tag.id
    tag.assigned_entity_type = entity_type
    tag.assigned_entity_id = entity_id
    if tag.issued_at is None:
        tag.issued_at = datetime.now(timezone.utc)

    if actor_id:
        tag.updated_by = actor_id
        entity.updated_by = actor_id

    db.commit()
    db.refresh(tag)
    return tag
