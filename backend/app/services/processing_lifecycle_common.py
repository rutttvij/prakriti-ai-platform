from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.collected_batch import CollectedBatch
from app.models.enums import ProcessingStatus, VerificationStatus
from app.models.facility_receipt import FacilityReceipt
from app.models.processing_facility import ProcessingFacility
from app.models.processing_record import ProcessingRecord
from app.models.transfer_record import TransferRecord
from app.services.operations_common import validate_city_ward_zone


def validate_facility_geography(
    db: Session,
    city_id: UUID,
    ward_id: UUID | None,
    zone_id: UUID | None,
) -> None:
    validate_city_ward_zone(db, city_id, ward_id, zone_id)


def get_facility(db: Session, facility_id: UUID) -> ProcessingFacility:
    facility = db.get(ProcessingFacility, facility_id)
    if not facility:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Processing facility not found")
    return facility


def get_batch(db: Session, batch_id: UUID) -> CollectedBatch:
    batch = db.get(CollectedBatch, batch_id)
    if not batch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Collected batch not found")
    return batch


def get_transfer(db: Session, transfer_id: UUID) -> TransferRecord:
    transfer = db.get(TransferRecord, transfer_id)
    if not transfer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transfer record not found")
    return transfer


def validate_facility_batch_compatibility(facility: ProcessingFacility, batch: CollectedBatch) -> None:
    if facility.city_id != batch.city_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Facility city does not match batch city")
    if facility.ward_id and batch.ward_id and facility.ward_id != batch.ward_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Facility ward does not match batch ward")


def validate_received_weight_reasonable(dispatched_weight_kg: float, received_weight_kg: float) -> None:
    if received_weight_kg <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Received weight must be positive")
    # Allow variance up to +20% to account for moisture/measurement differences.
    if received_weight_kg > dispatched_weight_kg * 1.2:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Received weight exceeds reasonable variance")


def validate_processing_weight_bounds(
    db: Session,
    batch: CollectedBatch,
    input_weight_kg: float,
) -> None:
    if input_weight_kg <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="input_weight_kg must be positive")

    if batch.total_weight_kg is not None:
        total_existing_input = db.scalar(
            select(func.coalesce(func.sum(ProcessingRecord.input_weight_kg), 0.0)).where(ProcessingRecord.batch_id == batch.id)
        )
        if float(total_existing_input or 0.0) + input_weight_kg > float(batch.total_weight_kg) + 1e-6:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Processing input exceeds available batch weight")


def validate_processing_output_sum(
    input_weight_kg: float,
    output_recovered_kg: float | None,
    output_rejected_kg: float | None,
    residue_to_landfill_kg: float | None,
) -> None:
    total_outputs = float(output_recovered_kg or 0) + float(output_rejected_kg or 0) + float(residue_to_landfill_kg or 0)
    if total_outputs - input_weight_kg > 1e-6:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Recovered + rejected + residue cannot exceed input weight")


def ensure_transfer_receipt_uniqueness(db: Session, transfer_record_id: UUID) -> None:
    existing = db.scalar(select(FacilityReceipt).where(FacilityReceipt.transfer_record_id == transfer_record_id))
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This transfer already has a facility receipt")


def batch_is_eligible_for_recovery_certificate(db: Session, batch_id: UUID) -> bool:
    has_completed_processing = db.scalar(
        select(ProcessingRecord.id).where(
            ProcessingRecord.batch_id == batch_id,
            ProcessingRecord.processing_status.in_([ProcessingStatus.COMPLETED, ProcessingStatus.PARTIAL]),
        )
    )
    if has_completed_processing:
        return True

    has_verified_receipt = db.scalar(
        select(FacilityReceipt.id)
        .join(TransferRecord, TransferRecord.id == FacilityReceipt.transfer_record_id)
        .where(
            TransferRecord.batch_id == batch_id,
            FacilityReceipt.verification_status == VerificationStatus.VERIFIED,
        )
    )
    return bool(has_verified_receipt)
