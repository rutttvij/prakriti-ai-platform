from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.routes.processing_scope_common import apply_scope_filters, enforce_scope, has_any_role
from app.core.dependencies import get_current_active_user, get_user_role_codes, require_roles
from app.db.session import get_db
from app.models.enums import BatchStatus
from app.models.user import User
from app.schemas.collected_batch import CollectedBatchCreate, CollectedBatchListItem, CollectedBatchRead
from app.services.collected_batch_service import create_collected_batch, get_collected_batch, list_collected_batches

router = APIRouter(prefix="/batches", tags=["batches"])


@router.post("", response_model=CollectedBatchRead)
def create_batch_endpoint(
    payload: CollectedBatchCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "SANITATION_SUPERVISOR")),
) -> CollectedBatchRead:
    role_codes = get_user_role_codes(current_user)
    enforce_scope(current_user, role_codes, payload.city_id, payload.ward_id)
    return create_collected_batch(db, payload, current_user.id)


@router.get("", response_model=list[CollectedBatchListItem])
def list_batches_endpoint(
    city_id: UUID | None = None,
    ward_id: UUID | None = None,
    zone_id: UUID | None = None,
    batch_status: BatchStatus | None = None,
    created_date: date | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> list[CollectedBatchListItem]:
    role_codes = get_user_role_codes(current_user)
    if not has_any_role(role_codes, {"SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "SANITATION_SUPERVISOR", "PROCESSOR", "AUDITOR"}) and not current_user.is_superuser:
        return []

    city_id, ward_id = apply_scope_filters(current_user, role_codes, city_id, ward_id)
    return list_collected_batches(db, city_id=city_id, ward_id=ward_id, zone_id=zone_id, batch_status=batch_status, created_date=created_date)


@router.get("/{batch_id}", response_model=CollectedBatchRead)
def get_batch_endpoint(
    batch_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> CollectedBatchRead:
    role_codes = get_user_role_codes(current_user)
    batch = get_collected_batch(db, batch_id)
    enforce_scope(current_user, role_codes, batch.city_id, batch.ward_id)
    return batch
