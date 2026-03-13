from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.routes.processing_scope_common import enforce_scope, has_any_role
from app.core.dependencies import get_current_active_user, get_user_role_codes, require_roles
from app.db.session import get_db
from app.models.enums import DisposalMethod
from app.models.user import User
from app.schemas.landfill_record import LandfillRecordCreate, LandfillRecordListItem, LandfillRecordRead
from app.services.processing_facility_service import get_processing_facility
from app.services.landfill_record_service import create_landfill_record, get_landfill_record, list_landfill_records

router = APIRouter(prefix="/landfill-records", tags=["landfill-records"])


@router.post("", response_model=LandfillRecordRead)
def create_landfill_record_endpoint(
    payload: LandfillRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "PROCESSOR")),
) -> LandfillRecordRead:
    role_codes = get_user_role_codes(current_user)
    facility = get_processing_facility(db, payload.facility_id)
    enforce_scope(current_user, role_codes, facility.city_id, facility.ward_id)
    return create_landfill_record(db, payload, current_user.id)


@router.get("", response_model=list[LandfillRecordListItem])
def list_landfill_records_endpoint(
    facility_id: UUID | None = None,
    batch_id: UUID | None = None,
    disposal_date: date | None = None,
    disposal_method: DisposalMethod | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> list[LandfillRecordListItem]:
    role_codes = get_user_role_codes(current_user)
    if not has_any_role(role_codes, {"SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "SANITATION_SUPERVISOR", "PROCESSOR", "AUDITOR"}) and not current_user.is_superuser:
        return []

    records = list_landfill_records(
        db,
        facility_id=facility_id,
        batch_id=batch_id,
        disposal_date=disposal_date,
        disposal_method=disposal_method,
    )

    scoped = []
    for record in records:
        try:
            enforce_scope(current_user, role_codes, record.facility.city_id, record.facility.ward_id)
            scoped.append(record)
        except HTTPException:
            continue
    return scoped


@router.get("/{landfill_record_id}", response_model=LandfillRecordRead)
def get_landfill_record_endpoint(
    landfill_record_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> LandfillRecordRead:
    role_codes = get_user_role_codes(current_user)
    record = get_landfill_record(db, landfill_record_id)
    enforce_scope(current_user, role_codes, record.facility.city_id, record.facility.ward_id)
    return record
