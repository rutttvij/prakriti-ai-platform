from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.routes.processing_scope_common import enforce_scope, has_any_role
from app.core.dependencies import get_current_active_user, get_user_role_codes, require_roles
from app.db.session import get_db
from app.models.enums import TransferStatus
from app.models.user import User
from app.schemas.transfer_record import (
    TransferReceiveRequest,
    TransferRecordCreate,
    TransferRecordListItem,
    TransferRecordRead,
)
from app.services.collected_batch_service import get_collected_batch
from app.services.transfer_record_service import create_transfer_record, get_transfer_record, list_transfer_records, receive_transfer

router = APIRouter(prefix="/transfers", tags=["transfers"])


@router.post("", response_model=TransferRecordRead)
def create_transfer_endpoint(
    payload: TransferRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "SANITATION_SUPERVISOR")),
) -> TransferRecordRead:
    role_codes = get_user_role_codes(current_user)
    batch = get_collected_batch(db, payload.batch_id)
    enforce_scope(current_user, role_codes, batch.city_id, batch.ward_id)
    return create_transfer_record(db, payload, current_user.id)


@router.get("", response_model=list[TransferRecordListItem])
def list_transfers_endpoint(
    batch_id: UUID | None = None,
    to_facility_id: UUID | None = None,
    transfer_status: TransferStatus | None = None,
    dispatched_at_from: datetime | None = None,
    dispatched_at_to: datetime | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> list[TransferRecordListItem]:
    role_codes = get_user_role_codes(current_user)
    if not has_any_role(role_codes, {"SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "SANITATION_SUPERVISOR", "PROCESSOR", "AUDITOR"}) and not current_user.is_superuser:
        return []

    transfers = list_transfer_records(
        db,
        batch_id=batch_id,
        to_facility_id=to_facility_id,
        transfer_status=transfer_status,
        dispatched_at_from=dispatched_at_from,
        dispatched_at_to=dispatched_at_to,
    )

    scoped = []
    for transfer in transfers:
        try:
            enforce_scope(current_user, role_codes, transfer.batch.city_id, transfer.batch.ward_id)
            scoped.append(transfer)
        except HTTPException:
            continue
    return scoped


@router.get("/{transfer_id}", response_model=TransferRecordRead)
def get_transfer_endpoint(
    transfer_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> TransferRecordRead:
    role_codes = get_user_role_codes(current_user)
    transfer = get_transfer_record(db, transfer_id)
    enforce_scope(current_user, role_codes, transfer.batch.city_id, transfer.batch.ward_id)
    return transfer


@router.post("/{transfer_id}/receive", response_model=TransferRecordRead)
def receive_transfer_endpoint(
    transfer_id: UUID,
    payload: TransferReceiveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "SANITATION_SUPERVISOR", "PROCESSOR")),
) -> TransferRecordRead:
    role_codes = get_user_role_codes(current_user)
    transfer = get_transfer_record(db, transfer_id)
    enforce_scope(current_user, role_codes, transfer.batch.city_id, transfer.batch.ward_id)
    transfer, _ = receive_transfer(db, transfer_id, payload, current_user.id)
    return transfer
