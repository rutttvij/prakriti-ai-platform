from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.models.enums import PickupEventType, PickupStatus
from app.models.pickup_task import PickupTask
from app.schemas.pickup_task import (
    PickupTaskCompleteRequest,
    PickupTaskCreate,
    PickupTaskMissRequest,
    PickupTaskStartRequest,
)
from app.services.operations_common import (
    create_pickup_log_internal,
    get_pickup_task,
    now_utc,
    resolve_source_entity,
    validate_city_ward_zone,
    validate_pickup_transition,
    validate_route_scope,
    validate_route_stop_scope,
    validate_shift_scope,
    validate_source_in_geography,
    validate_vehicle_assignment,
    validate_worker_assignment,
)


def create_pickup_task(db: Session, payload: PickupTaskCreate, actor_id: UUID | None = None) -> PickupTask:
    validate_city_ward_zone(db, payload.city_id, payload.ward_id, payload.zone_id)

    source = resolve_source_entity(db, payload.source_type, payload.household_id, payload.bulk_generator_id)
    validate_source_in_geography(source, payload.city_id, payload.ward_id, payload.zone_id)

    route = validate_route_scope(db, payload.route_id, payload.city_id, payload.ward_id, payload.zone_id)
    validate_route_stop_scope(
        db,
        payload.route_stop_id,
        route,
        payload.source_type,
        payload.household_id,
        payload.bulk_generator_id,
    )
    validate_shift_scope(db, payload.shift_id, payload.city_id, payload.ward_id, payload.zone_id)
    validate_worker_assignment(db, payload.assigned_worker_id, payload.city_id, payload.ward_id)
    validate_vehicle_assignment(db, payload.assigned_vehicle_id, payload.city_id, payload.ward_id)

    task = PickupTask(**payload.model_dump())
    if actor_id:
        task.created_by = actor_id
        task.updated_by = actor_id

    db.add(task)
    db.flush()

    if task.assigned_worker_id:
        create_pickup_log_internal(
            db,
            pickup_task_id=task.id,
            worker_profile_id=task.assigned_worker_id,
            event_type=PickupEventType.TASK_CREATED,
            notes="Pickup task created and assigned",
            actor_id=actor_id,
        )

    db.commit()
    db.refresh(task)
    return task


def list_pickup_tasks(
    db: Session,
    city_id: UUID | None = None,
    ward_id: UUID | None = None,
    zone_id: UUID | None = None,
    route_id: UUID | None = None,
    shift_id: UUID | None = None,
    assigned_worker_id: UUID | None = None,
    assigned_vehicle_id: UUID | None = None,
    source_type=None,
    pickup_status=None,
    scheduled_date=None,
) -> list[PickupTask]:
    query: Select[tuple[PickupTask]] = select(PickupTask).order_by(PickupTask.scheduled_date.desc(), PickupTask.created_at.desc())
    if city_id:
        query = query.where(PickupTask.city_id == city_id)
    if ward_id:
        query = query.where(PickupTask.ward_id == ward_id)
    if zone_id:
        query = query.where(PickupTask.zone_id == zone_id)
    if route_id:
        query = query.where(PickupTask.route_id == route_id)
    if shift_id:
        query = query.where(PickupTask.shift_id == shift_id)
    if assigned_worker_id:
        query = query.where(PickupTask.assigned_worker_id == assigned_worker_id)
    if assigned_vehicle_id:
        query = query.where(PickupTask.assigned_vehicle_id == assigned_vehicle_id)
    if source_type:
        query = query.where(PickupTask.source_type == source_type)
    if pickup_status:
        query = query.where(PickupTask.pickup_status == pickup_status)
    if scheduled_date:
        query = query.where(PickupTask.scheduled_date == scheduled_date)
    return list(db.scalars(query).all())


def get_pickup_task_by_id(db: Session, pickup_task_id: UUID) -> PickupTask:
    return get_pickup_task(db, pickup_task_id)


def start_pickup_task(
    db: Session,
    pickup_task_id: UUID,
    payload: PickupTaskStartRequest,
    actor_id: UUID,
    actor_worker_profile_id: UUID | None,
) -> PickupTask:
    task = get_pickup_task(db, pickup_task_id)
    validate_pickup_transition(task.pickup_status, PickupStatus.IN_PROGRESS)

    task.pickup_status = PickupStatus.IN_PROGRESS
    task.actual_start_at = now_utc()
    if payload.notes:
        task.notes = payload.notes
    if payload.photo_url:
        task.proof_photo_url = payload.photo_url
    task.updated_by = actor_id

    worker_for_log = actor_worker_profile_id or task.assigned_worker_id
    if worker_for_log:
        create_pickup_log_internal(
            db,
            pickup_task_id=task.id,
            worker_profile_id=worker_for_log,
            event_type=PickupEventType.TASK_STARTED,
            latitude=payload.latitude,
            longitude=payload.longitude,
            notes=payload.notes,
            photo_url=payload.photo_url,
            actor_id=actor_id,
        )

    db.commit()
    db.refresh(task)
    return task


def complete_pickup_task(
    db: Session,
    pickup_task_id: UUID,
    payload: PickupTaskCompleteRequest,
    actor_id: UUID,
    actor_worker_profile_id: UUID | None,
) -> PickupTask:
    task = get_pickup_task(db, pickup_task_id)
    validate_pickup_transition(task.pickup_status, PickupStatus.COMPLETED)

    task.pickup_status = PickupStatus.COMPLETED
    task.actual_completed_at = now_utc()
    if payload.actual_weight_kg is not None:
        task.actual_weight_kg = payload.actual_weight_kg
    if payload.waste_category is not None:
        task.waste_category = payload.waste_category
    if payload.contamination_flag is not None:
        task.contamination_flag = payload.contamination_flag
    if payload.notes:
        task.notes = payload.notes
    if payload.photo_url:
        task.proof_photo_url = payload.photo_url
    task.updated_by = actor_id

    worker_for_log = actor_worker_profile_id or task.assigned_worker_id
    if worker_for_log:
        create_pickup_log_internal(
            db,
            pickup_task_id=task.id,
            worker_profile_id=worker_for_log,
            event_type=PickupEventType.TASK_COMPLETED,
            latitude=payload.latitude,
            longitude=payload.longitude,
            notes=payload.notes,
            weight_kg=payload.actual_weight_kg,
            photo_url=payload.photo_url,
            actor_id=actor_id,
        )

    db.commit()
    db.refresh(task)
    return task


def miss_pickup_task(
    db: Session,
    pickup_task_id: UUID,
    payload: PickupTaskMissRequest,
    actor_id: UUID,
    actor_worker_profile_id: UUID | None,
) -> PickupTask:
    task = get_pickup_task(db, pickup_task_id)
    validate_pickup_transition(task.pickup_status, PickupStatus.MISSED)

    task.pickup_status = PickupStatus.MISSED
    task.notes = payload.notes
    if payload.photo_url:
        task.proof_photo_url = payload.photo_url
    task.updated_by = actor_id

    worker_for_log = actor_worker_profile_id or task.assigned_worker_id
    if worker_for_log:
        create_pickup_log_internal(
            db,
            pickup_task_id=task.id,
            worker_profile_id=worker_for_log,
            event_type=PickupEventType.TASK_MISSED,
            latitude=payload.latitude,
            longitude=payload.longitude,
            notes=payload.notes,
            photo_url=payload.photo_url,
            actor_id=actor_id,
        )

    db.commit()
    db.refresh(task)
    return task
