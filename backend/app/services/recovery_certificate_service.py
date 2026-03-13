from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.models.bulk_waste_generator import BulkWasteGenerator
from app.models.recovery_certificate import RecoveryCertificate
from app.schemas.recovery_certificate import RecoveryCertificateCreate
from app.services.processing_lifecycle_common import (
    batch_is_eligible_for_recovery_certificate,
    get_batch,
    get_facility,
    validate_facility_batch_compatibility,
)


def create_recovery_certificate(db: Session, payload: RecoveryCertificateCreate, actor_id: UUID | None = None) -> RecoveryCertificate:
    existing = db.scalar(select(RecoveryCertificate).where(RecoveryCertificate.certificate_number == payload.certificate_number))
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Certificate number already exists")

    batch = get_batch(db, payload.batch_id)
    facility = get_facility(db, payload.facility_id)
    validate_facility_batch_compatibility(facility, batch)

    if not batch_is_eligible_for_recovery_certificate(db, payload.batch_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Batch is not eligible for recovery certification")

    if payload.bulk_generator_id:
        bulk = db.get(BulkWasteGenerator, payload.bulk_generator_id)
        if not bulk:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bulk generator not found")

    certificate = RecoveryCertificate(**payload.model_dump())
    if actor_id:
        certificate.created_by = actor_id
        certificate.updated_by = actor_id

    db.add(certificate)
    db.commit()
    db.refresh(certificate)
    return certificate


def list_recovery_certificates(
    db: Session,
    facility_id: UUID | None = None,
    batch_id: UUID | None = None,
    bulk_generator_id: UUID | None = None,
    waste_type=None,
    verification_status=None,
) -> list[RecoveryCertificate]:
    query: Select[tuple[RecoveryCertificate]] = select(RecoveryCertificate).order_by(RecoveryCertificate.issue_date.desc(), RecoveryCertificate.created_at.desc())
    if facility_id:
        query = query.where(RecoveryCertificate.facility_id == facility_id)
    if batch_id:
        query = query.where(RecoveryCertificate.batch_id == batch_id)
    if bulk_generator_id:
        query = query.where(RecoveryCertificate.bulk_generator_id == bulk_generator_id)
    if waste_type:
        query = query.where(RecoveryCertificate.waste_type == waste_type)
    if verification_status:
        query = query.where(RecoveryCertificate.verification_status == verification_status)
    return list(db.scalars(query).all())


def get_recovery_certificate(db: Session, certificate_id: UUID) -> RecoveryCertificate:
    cert = db.get(RecoveryCertificate, certificate_id)
    if not cert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recovery certificate not found")
    return cert
