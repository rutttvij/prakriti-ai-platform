from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.routes.operations_common import enforce_operational_scope, is_manager, is_super_admin, is_worker, scope_list_filters
from app.core.dependencies import get_current_active_user, get_user_role_codes, require_roles
from app.db.session import get_db
from app.models.enums import OperationalSourceType, PickupStatus
from app.models.user import User
from app.schemas.pickup_task import (
    PickupTaskActionResponse,
    PickupTaskCompleteRequest,
    PickupTaskCreate,
    PickupTaskListItem,
    PickupTaskMissRequest,
    PickupTaskRead,
    PickupTaskStartRequest,
)
from app.services.operations_common import get_worker_profile_for_user
from app.services.pickup_task_service import (
    complete_pickup_task,
    create_pickup_task,
    get_pickup_task_by_id,
    list_pickup_tasks,
    miss_pickup_task,
    start_pickup_task,
)

router = APIRouter(prefix="/pickup-tasks", tags=["pickup-tasks"])


@router.post("", response_model=PickupTaskRead)
def create_pickup_task_endpoint(
    payload: PickupTaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "SANITATION_SUPERVISOR")),
) -> PickupTaskRead:
    role_codes = get_user_role_codes(current_user)
    enforce_operational_scope(current_user, role_codes, payload.city_id, payload.ward_id)
    return create_pickup_task(db, payload, current_user.id)


@router.get("", response_model=list[PickupTaskListItem])
def list_pickup_tasks_endpoint(
    city_id: UUID | None = None,
    ward_id: UUID | None = None,
    zone_id: UUID | None = None,
    route_id: UUID | None = None,
    shift_id: UUID | None = None,
    assigned_worker_id: UUID | None = None,
    assigned_vehicle_id: UUID | None = None,
    source_type: OperationalSourceType | None = None,
    pickup_status: PickupStatus | None = None,
    scheduled_date: date | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> list[PickupTaskListItem]:
    role_codes = get_user_role_codes(current_user)

    if is_worker(role_codes) and not is_manager(current_user, role_codes):
        worker = get_worker_profile_for_user(db, current_user.id)
        if not worker:
            return []
        assigned_worker_id = worker.id
    elif is_manager(current_user, role_codes):
        if not is_super_admin(current_user, role_codes):
            city_id, ward_id = scope_list_filters(current_user, role_codes, city_id, ward_id)
    else:
        return []

    return list_pickup_tasks(
        db,
        city_id=city_id,
        ward_id=ward_id,
        zone_id=zone_id,
        route_id=route_id,
        shift_id=shift_id,
        assigned_worker_id=assigned_worker_id,
        assigned_vehicle_id=assigned_vehicle_id,
        source_type=source_type,
        pickup_status=pickup_status,
        scheduled_date=scheduled_date,
    )


@router.get("/{pickup_task_id}", response_model=PickupTaskRead)
def get_pickup_task_endpoint(
    pickup_task_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> PickupTaskRead:
    role_codes = get_user_role_codes(current_user)
    task = get_pickup_task_by_id(db, pickup_task_id)

    if is_worker(role_codes) and not is_manager(current_user, role_codes):
        worker = get_worker_profile_for_user(db, current_user.id)
        if not worker or task.assigned_worker_id != worker.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="WORKER can only view assigned tasks")
        return task

    if not is_manager(current_user, role_codes):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient role permissions")

    enforce_operational_scope(current_user, role_codes, task.city_id, task.ward_id)
    return task


def _resolve_actor_worker_id_for_task(db: Session, current_user: User, role_codes: set[str], task) -> UUID | None:
    if is_worker(role_codes) and not is_manager(current_user, role_codes):
        worker = get_worker_profile_for_user(db, current_user.id)
        if not worker or task.assigned_worker_id != worker.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="WORKER can only act on assigned tasks")
        return worker.id

    if is_manager(current_user, role_codes):
        enforce_operational_scope(current_user, role_codes, task.city_id, task.ward_id)
        worker = get_worker_profile_for_user(db, current_user.id)
        return worker.id if worker else None

    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient role permissions")


@router.post("/{pickup_task_id}/start", response_model=PickupTaskActionResponse)
def start_pickup_task_endpoint(
    pickup_task_id: UUID,
    payload: PickupTaskStartRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> PickupTaskActionResponse:
    role_codes = get_user_role_codes(current_user)
    task = get_pickup_task_by_id(db, pickup_task_id)
    actor_worker_id = _resolve_actor_worker_id_for_task(db, current_user, role_codes, task)
    task = start_pickup_task(db, pickup_task_id, payload, current_user.id, actor_worker_id)
    return PickupTaskActionResponse(task=PickupTaskRead.model_validate(task), message="Pickup task started")


@router.post("/{pickup_task_id}/complete", response_model=PickupTaskActionResponse)
def complete_pickup_task_endpoint(
    pickup_task_id: UUID,
    payload: PickupTaskCompleteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> PickupTaskActionResponse:
    role_codes = get_user_role_codes(current_user)
    task = get_pickup_task_by_id(db, pickup_task_id)
    actor_worker_id = _resolve_actor_worker_id_for_task(db, current_user, role_codes, task)
    task = complete_pickup_task(db, pickup_task_id, payload, current_user.id, actor_worker_id)
    return PickupTaskActionResponse(task=PickupTaskRead.model_validate(task), message="Pickup task completed")


@router.post("/{pickup_task_id}/miss", response_model=PickupTaskActionResponse)
def miss_pickup_task_endpoint(
    pickup_task_id: UUID,
    payload: PickupTaskMissRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> PickupTaskActionResponse:
    role_codes = get_user_role_codes(current_user)
    task = get_pickup_task_by_id(db, pickup_task_id)
    actor_worker_id = _resolve_actor_worker_id_for_task(db, current_user, role_codes, task)
    task = miss_pickup_task(db, pickup_task_id, payload, current_user.id, actor_worker_id)
    return PickupTaskActionResponse(task=PickupTaskRead.model_validate(task), message="Pickup task marked as missed")
