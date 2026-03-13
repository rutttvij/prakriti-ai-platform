from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.routes.operations_common import enforce_operational_scope, is_manager, is_super_admin, is_worker, scope_list_filters
from app.core.dependencies import get_current_active_user, get_user_role_codes, require_roles
from app.db.session import get_db
from app.models.enums import EmploymentStatus
from app.models.user import User
from app.schemas.worker_profile import WorkerProfileCreate, WorkerProfileListItem, WorkerProfileRead
from app.services.operations_common import get_worker_profile_for_user
from app.services.worker_profile_service import create_worker_profile, get_worker_profile, list_worker_profiles

router = APIRouter(prefix="/workers", tags=["workers"])


@router.post("", response_model=WorkerProfileRead)
def create_worker_profile_endpoint(
    payload: WorkerProfileCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "SANITATION_SUPERVISOR")),
) -> WorkerProfileRead:
    role_codes = get_user_role_codes(current_user)
    enforce_operational_scope(current_user, role_codes, payload.city_id, payload.ward_id)
    return create_worker_profile(db, payload, current_user.id)


@router.get("", response_model=list[WorkerProfileListItem])
def list_workers_endpoint(
    city_id: UUID | None = None,
    ward_id: UUID | None = None,
    zone_id: UUID | None = None,
    employment_status: EmploymentStatus | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> list[WorkerProfileListItem]:
    role_codes = get_user_role_codes(current_user)

    if is_worker(role_codes) and not is_manager(current_user, role_codes):
        own = get_worker_profile_for_user(db, current_user.id)
        return [own] if own else []

    if not is_manager(current_user, role_codes):
        return []

    city_id, ward_id = scope_list_filters(current_user, role_codes, city_id, ward_id)
    return list_worker_profiles(db, city_id=city_id, ward_id=ward_id, zone_id=zone_id, employment_status=employment_status)


@router.get("/{worker_id}", response_model=WorkerProfileRead)
def get_worker_endpoint(
    worker_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> WorkerProfileRead:
    role_codes = get_user_role_codes(current_user)
    worker = get_worker_profile(db, worker_id)

    if is_worker(role_codes) and not is_manager(current_user, role_codes):
        own = get_worker_profile_for_user(db, current_user.id)
        if not own or own.id != worker.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="WORKER can only view own worker profile")
        return worker

    if not is_manager(current_user, role_codes):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient role permissions")

    enforce_operational_scope(current_user, role_codes, worker.city_id, worker.ward_id)
    return worker
