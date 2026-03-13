from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.routes.processing_scope_common import enforce_scope, has_any_role
from app.core.dependencies import get_current_active_user, get_user_role_codes, require_roles
from app.db.session import get_db
from app.models.enums import VerificationStatus
from app.models.user import User
from app.schemas.facility_receipt import FacilityReceiptCreate, FacilityReceiptListItem, FacilityReceiptRead
from app.services.transfer_record_service import get_transfer_record
from app.services.facility_receipt_service import create_facility_receipt, get_facility_receipt, list_facility_receipts

router = APIRouter(prefix="/facility-receipts", tags=["facility-receipts"])


@router.post("", response_model=FacilityReceiptRead)
def create_facility_receipt_endpoint(
    payload: FacilityReceiptCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "PROCESSOR")),
) -> FacilityReceiptRead:
    role_codes = get_user_role_codes(current_user)
    transfer = get_transfer_record(db, payload.transfer_record_id)
    enforce_scope(current_user, role_codes, transfer.batch.city_id, transfer.batch.ward_id)
    return create_facility_receipt(db, payload, current_user.id)


@router.get("", response_model=list[FacilityReceiptListItem])
def list_facility_receipts_endpoint(
    facility_id: UUID | None = None,
    transfer_record_id: UUID | None = None,
    verification_status: VerificationStatus | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> list[FacilityReceiptListItem]:
    role_codes = get_user_role_codes(current_user)
    if not has_any_role(role_codes, {"SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "SANITATION_SUPERVISOR", "PROCESSOR", "AUDITOR"}) and not current_user.is_superuser:
        return []

    receipts = list_facility_receipts(db, facility_id=facility_id, transfer_record_id=transfer_record_id, verification_status=verification_status)
    scoped = []
    for receipt in receipts:
        try:
            enforce_scope(current_user, role_codes, receipt.transfer_record.batch.city_id, receipt.transfer_record.batch.ward_id)
            scoped.append(receipt)
        except HTTPException:
            continue
    return scoped


@router.get("/{receipt_id}", response_model=FacilityReceiptRead)
def get_facility_receipt_endpoint(
    receipt_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> FacilityReceiptRead:
    role_codes = get_user_role_codes(current_user)
    receipt = get_facility_receipt(db, receipt_id)
    enforce_scope(current_user, role_codes, receipt.transfer_record.batch.city_id, receipt.transfer_record.batch.ward_id)
    return receipt
