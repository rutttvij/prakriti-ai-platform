from datetime import datetime
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.models.enums import BatchStatus, TransferStatus
from app.models.facility_receipt import FacilityReceipt
from app.models.transfer_record import TransferRecord
from app.schemas.transfer_record import TransferReceiveRequest, TransferRecordCreate
from app.services.operations_common import now_utc
from app.services.processing_lifecycle_common import (
    ensure_transfer_receipt_uniqueness,
    get_batch,
    get_facility,
    get_transfer,
    validate_facility_batch_compatibility,
    validate_received_weight_reasonable,
)


def create_transfer_record(db: Session, payload: TransferRecordCreate, actor_id: UUID | None = None) -> TransferRecord:
    batch = get_batch(db, payload.batch_id)
    facility = get_facility(db, payload.to_facility_id)
    validate_facility_batch_compatibility(facility, batch)

    if payload.dispatched_weight_kg <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="dispatched_weight_kg must be positive")

    if batch.total_weight_kg and payload.dispatched_weight_kg > float(batch.total_weight_kg) * 1.2:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Dispatched weight is not reasonable for the batch")

    transfer = TransferRecord(
        **payload.model_dump(),
        transfer_status=TransferStatus.DISPATCHED,
    )
    if actor_id:
        transfer.created_by = actor_id
        transfer.updated_by = actor_id

    batch.batch_status = BatchStatus.IN_TRANSIT
    if actor_id:
        batch.updated_by = actor_id

    db.add(transfer)
    db.commit()
    db.refresh(transfer)
    return transfer


def list_transfer_records(
    db: Session,
    batch_id: UUID | None = None,
    to_facility_id: UUID | None = None,
    transfer_status=None,
    dispatched_at_from: datetime | None = None,
    dispatched_at_to: datetime | None = None,
) -> list[TransferRecord]:
    query: Select[tuple[TransferRecord]] = select(TransferRecord).order_by(TransferRecord.dispatched_at.desc())
    if batch_id:
        query = query.where(TransferRecord.batch_id == batch_id)
    if to_facility_id:
        query = query.where(TransferRecord.to_facility_id == to_facility_id)
    if transfer_status:
        query = query.where(TransferRecord.transfer_status == transfer_status)
    if dispatched_at_from:
        query = query.where(TransferRecord.dispatched_at >= dispatched_at_from)
    if dispatched_at_to:
        query = query.where(TransferRecord.dispatched_at <= dispatched_at_to)
    return list(db.scalars(query).all())


def get_transfer_record(db: Session, transfer_id: UUID) -> TransferRecord:
    return get_transfer(db, transfer_id)


def receive_transfer(db: Session, transfer_id: UUID, payload: TransferReceiveRequest, actor_id: UUID | None = None) -> tuple[TransferRecord, FacilityReceipt | None]:
    transfer = get_transfer(db, transfer_id)

    if transfer.transfer_status == TransferStatus.RECEIVED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Transfer is already received")

    validate_received_weight_reasonable(transfer.dispatched_weight_kg, payload.received_weight_kg)

    transfer.received_at = payload.received_at or now_utc()
    transfer.received_weight_kg = payload.received_weight_kg
    transfer.transfer_status = TransferStatus.RECEIVED
    if payload.notes:
        transfer.notes = payload.notes
    if actor_id:
        transfer.updated_by = actor_id

    batch = transfer.batch
    batch.batch_status = BatchStatus.RECEIVED
    if actor_id:
        batch.updated_by = actor_id

    receipt = None
    if payload.create_receipt:
        ensure_transfer_receipt_uniqueness(db, transfer.id)
        net_weight = payload.net_weight_kg or payload.received_weight_kg
        validate_received_weight_reasonable(transfer.dispatched_weight_kg, net_weight)

        receipt = FacilityReceipt(
            transfer_record_id=transfer.id,
            facility_id=transfer.to_facility_id,
            received_by_user_id=payload.facility_received_by_user_id,
            received_at=transfer.received_at,
            gross_weight_kg=payload.gross_weight_kg,
            net_weight_kg=net_weight,
            contamination_notes=payload.contamination_notes,
            verification_status=payload.verification_status,
            proof_document_url=payload.proof_document_url,
            notes=payload.notes,
        )
        if actor_id:
            receipt.created_by = actor_id
            receipt.updated_by = actor_id
        db.add(receipt)

    db.commit()
    db.refresh(transfer)
    if receipt:
        db.refresh(receipt)
    return transfer, receipt
