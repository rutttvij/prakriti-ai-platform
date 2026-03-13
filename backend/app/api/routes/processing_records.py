from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.routes.processing_scope_common import enforce_scope, has_any_role
from app.core.dependencies import get_current_active_user, get_user_role_codes, require_roles
from app.db.session import get_db
from app.models.enums import ProcessType, ProcessingStatus
from app.models.user import User
from app.schemas.processing_record import ProcessingRecordCreate, ProcessingRecordListItem, ProcessingRecordRead
from app.services.collected_batch_service import get_collected_batch
from app.services.processing_record_service import create_processing_record, get_processing_record, list_processing_records

router = APIRouter(prefix="/processing-records", tags=["processing-records"])


@router.post("", response_model=ProcessingRecordRead)
def create_processing_record_endpoint(
    payload: ProcessingRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "PROCESSOR")),
) -> ProcessingRecordRead:
    role_codes = get_user_role_codes(current_user)
    batch = get_collected_batch(db, payload.batch_id)
    enforce_scope(current_user, role_codes, batch.city_id, batch.ward_id)
    return create_processing_record(db, payload, current_user.id)


@router.get("", response_model=list[ProcessingRecordListItem])
def list_processing_records_endpoint(
    facility_id: UUID | None = None,
    batch_id: UUID | None = None,
    process_type: ProcessType | None = None,
    processing_status: ProcessingStatus | None = None,
    processed_at_from: datetime | None = None,
    processed_at_to: datetime | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> list[ProcessingRecordListItem]:
    role_codes = get_user_role_codes(current_user)
    if not has_any_role(role_codes, {"SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "SANITATION_SUPERVISOR", "PROCESSOR", "AUDITOR"}) and not current_user.is_superuser:
        return []

    records = list_processing_records(
        db,
        facility_id=facility_id,
        batch_id=batch_id,
        process_type=process_type,
        processing_status=processing_status,
        processed_at_from=processed_at_from,
        processed_at_to=processed_at_to,
    )
    scoped = []
    for record in records:
        try:
            enforce_scope(current_user, role_codes, record.batch.city_id, record.batch.ward_id)
            scoped.append(record)
        except HTTPException:
            continue
    return scoped


@router.get("/{processing_record_id}", response_model=ProcessingRecordRead)
def get_processing_record_endpoint(
    processing_record_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> ProcessingRecordRead:
    role_codes = get_user_role_codes(current_user)
    record = get_processing_record(db, processing_record_id)
    enforce_scope(current_user, role_codes, record.batch.city_id, record.batch.ward_id)
    return record
