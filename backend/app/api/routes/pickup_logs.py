from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.routes.operations_common import enforce_operational_scope, is_manager, is_worker
from app.core.dependencies import get_current_active_user, get_user_role_codes
from app.db.session import get_db
from app.models.enums import PickupEventType
from app.models.user import User
from app.schemas.pickup_log import PickupLogCreate, PickupLogListItem, PickupLogRead
from app.services.operations_common import get_pickup_task, get_worker_profile_for_user
from app.services.pickup_log_service import create_pickup_log, get_pickup_log, list_pickup_logs

router = APIRouter(prefix="/pickup-logs", tags=["pickup-logs"])


@router.post("", response_model=PickupLogRead)
def create_pickup_log_endpoint(
    payload: PickupLogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> PickupLogRead:
    role_codes = get_user_role_codes(current_user)
    task = get_pickup_task(db, payload.pickup_task_id)

    if is_worker(role_codes) and not is_manager(current_user, role_codes):
        own_worker = get_worker_profile_for_user(db, current_user.id)
        if not own_worker or own_worker.id != payload.worker_profile_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="WORKER can only create logs for own profile")
        if task.assigned_worker_id != own_worker.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="WORKER can only log assigned tasks")
    elif is_manager(current_user, role_codes):
        enforce_operational_scope(current_user, role_codes, task.city_id, task.ward_id)
    else:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient role permissions")

    return create_pickup_log(db, payload, current_user.id)


@router.get("", response_model=list[PickupLogListItem])
def list_pickup_logs_endpoint(
    pickup_task_id: UUID | None = None,
    worker_profile_id: UUID | None = None,
    event_type: PickupEventType | None = None,
    event_at_from: datetime | None = None,
    event_at_to: datetime | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> list[PickupLogListItem]:
    role_codes = get_user_role_codes(current_user)

    if is_worker(role_codes) and not is_manager(current_user, role_codes):
        own_worker = get_worker_profile_for_user(db, current_user.id)
        if not own_worker:
            return []
        worker_profile_id = own_worker.id
    elif not is_manager(current_user, role_codes):
        return []

    logs = list_pickup_logs(
        db,
        pickup_task_id=pickup_task_id,
        worker_profile_id=worker_profile_id,
        event_type=event_type,
        event_at_from=event_at_from,
        event_at_to=event_at_to,
    )

    if is_manager(current_user, role_codes):
        scoped = []
        for log in logs:
            task = log.pickup_task
            try:
                enforce_operational_scope(current_user, role_codes, task.city_id, task.ward_id)
                scoped.append(log)
            except HTTPException:
                continue
        return scoped

    return logs


@router.get("/{pickup_log_id}", response_model=PickupLogRead)
def get_pickup_log_endpoint(
    pickup_log_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> PickupLogRead:
    role_codes = get_user_role_codes(current_user)
    log = get_pickup_log(db, pickup_log_id)

    if is_worker(role_codes) and not is_manager(current_user, role_codes):
        own_worker = get_worker_profile_for_user(db, current_user.id)
        if not own_worker or own_worker.id != log.worker_profile_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="WORKER can only view own logs")
        if log.pickup_task.assigned_worker_id != own_worker.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="WORKER can only view logs for assigned tasks")
        return log

    if not is_manager(current_user, role_codes):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient role permissions")

    enforce_operational_scope(current_user, role_codes, log.pickup_task.city_id, log.pickup_task.ward_id)
    return log
