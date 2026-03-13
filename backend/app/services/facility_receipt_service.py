from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.models.facility_receipt import FacilityReceipt
from app.models.enums import TransferStatus
from app.schemas.facility_receipt import FacilityReceiptCreate
from app.services.processing_lifecycle_common import (
    ensure_transfer_receipt_uniqueness,
    get_facility,
    get_transfer,
    validate_received_weight_reasonable,
)


def create_facility_receipt(db: Session, payload: FacilityReceiptCreate, actor_id: UUID | None = None) -> FacilityReceipt:
    transfer = get_transfer(db, payload.transfer_record_id)
    facility = get_facility(db, payload.facility_id)

    if transfer.to_facility_id != facility.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Receipt facility does not match transfer destination facility")

    ensure_transfer_receipt_uniqueness(db, transfer.id)
    validate_received_weight_reasonable(transfer.dispatched_weight_kg, payload.net_weight_kg)

    receipt = FacilityReceipt(**payload.model_dump())
    if actor_id:
        receipt.created_by = actor_id
        receipt.updated_by = actor_id

    transfer.received_at = payload.received_at
    transfer.received_weight_kg = payload.net_weight_kg
    transfer.transfer_status = TransferStatus.RECEIVED
    if actor_id:
        transfer.updated_by = actor_id

    db.add(receipt)
    db.commit()
    db.refresh(receipt)
    return receipt


def list_facility_receipts(
    db: Session,
    facility_id: UUID | None = None,
    transfer_record_id: UUID | None = None,
    verification_status=None,
) -> list[FacilityReceipt]:
    query: Select[tuple[FacilityReceipt]] = select(FacilityReceipt).order_by(FacilityReceipt.received_at.desc())
    if facility_id:
        query = query.where(FacilityReceipt.facility_id == facility_id)
    if transfer_record_id:
        query = query.where(FacilityReceipt.transfer_record_id == transfer_record_id)
    if verification_status:
        query = query.where(FacilityReceipt.verification_status == verification_status)
    return list(db.scalars(query).all())


def get_facility_receipt(db: Session, receipt_id: UUID) -> FacilityReceipt:
    receipt = db.get(FacilityReceipt, receipt_id)
    if not receipt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Facility receipt not found")
    return receipt
