from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.routes.operations_common import enforce_operational_scope, is_manager, scope_list_filters
from app.core.dependencies import get_current_active_user, get_user_role_codes, require_roles
from app.db.session import get_db
from app.models.user import User
from app.schemas.shift import ShiftCreate, ShiftListItem, ShiftRead
from app.services.shift_service import create_shift, get_shift, list_shifts

router = APIRouter(prefix="/shifts", tags=["shifts"])


@router.post("", response_model=ShiftRead)
def create_shift_endpoint(
    payload: ShiftCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "SANITATION_SUPERVISOR")),
) -> ShiftRead:
    role_codes = get_user_role_codes(current_user)
    enforce_operational_scope(current_user, role_codes, payload.city_id, payload.ward_id)
    return create_shift(db, payload, current_user.id)


@router.get("", response_model=list[ShiftListItem])
def list_shifts_endpoint(
    city_id: UUID | None = None,
    ward_id: UUID | None = None,
    zone_id: UUID | None = None,
    shift_date: date | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> list[ShiftListItem]:
    role_codes = get_user_role_codes(current_user)
    if not is_manager(current_user, role_codes):
        return []

    city_id, ward_id = scope_list_filters(current_user, role_codes, city_id, ward_id)
    return list_shifts(db, city_id=city_id, ward_id=ward_id, zone_id=zone_id, shift_date=shift_date)


@router.get("/{shift_id}", response_model=ShiftRead)
def get_shift_endpoint(
    shift_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "SANITATION_SUPERVISOR")),
) -> ShiftRead:
    role_codes = get_user_role_codes(current_user)
    shift = get_shift(db, shift_id)
    enforce_operational_scope(current_user, role_codes, shift.city_id, shift.ward_id)
    return shift
