from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.bulk_waste_generator import BulkWasteGenerator
from app.models.city import City
from app.models.enums import EmploymentStatus, OperationalSourceType, PickupStatus
from app.models.household import Household
from app.models.pickup_log import PickupLog
from app.models.pickup_task import PickupTask
from app.models.role import Role
from app.models.route import Route
from app.models.route_stop import RouteStop
from app.models.shift import Shift
from app.models.user import User
from app.models.user_role import UserRole
from app.models.vehicle import Vehicle
from app.models.ward import Ward
from app.models.worker_profile import WorkerProfile
from app.models.zone import Zone


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def validate_city_ward_zone(db: Session, city_id: UUID, ward_id: UUID | None, zone_id: UUID | None) -> tuple[City, Ward | None, Zone | None]:
    city = db.get(City, city_id)
    if not city:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="City not found")

    ward = db.get(Ward, ward_id) if ward_id else None
    zone = db.get(Zone, zone_id) if zone_id else None

    if ward_id and not ward:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ward not found")
    if zone_id and not zone:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Zone not found")

    if ward and ward.city_id != city.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ward does not belong to city")
    if zone and not ward:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="ward_id is required when zone_id is provided")
    if zone and ward and zone.ward_id != ward.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Zone does not belong to ward")

    return city, ward, zone


def resolve_source_entity(
    db: Session,
    source_type: OperationalSourceType,
    household_id: UUID | None,
    bulk_generator_id: UUID | None,
) -> Household | BulkWasteGenerator:
    if source_type == OperationalSourceType.HOUSEHOLD:
        if household_id is None or bulk_generator_id is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="For HOUSEHOLD source_type, household_id is required and bulk_generator_id must be null",
            )
        household = db.get(Household, household_id)
        if not household:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Household not found")
        return household

    if bulk_generator_id is None or household_id is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="For BULK_GENERATOR source_type, bulk_generator_id is required and household_id must be null",
        )
    bulk_generator = db.get(BulkWasteGenerator, bulk_generator_id)
    if not bulk_generator:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bulk generator not found")
    return bulk_generator


def validate_source_in_geography(source: Household | BulkWasteGenerator, city_id: UUID, ward_id: UUID, zone_id: UUID | None) -> None:
    if source.city_id != city_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Source city does not match task geography")
    if source.ward_id != ward_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Source ward does not match task geography")
    if zone_id and source.zone_id != zone_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Source zone does not match task geography")


def validate_route_scope(db: Session, route_id: UUID | None, city_id: UUID, ward_id: UUID, zone_id: UUID | None) -> Route | None:
    if route_id is None:
        return None
    route = db.get(Route, route_id)
    if not route:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Route not found")
    if route.city_id != city_id or route.ward_id != ward_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Route does not belong to task geography")
    if zone_id and route.zone_id and route.zone_id != zone_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Route zone does not match task zone")
    return route


def validate_route_stop_scope(
    db: Session,
    route_stop_id: UUID | None,
    route: Route | None,
    source_type: OperationalSourceType,
    household_id: UUID | None,
    bulk_generator_id: UUID | None,
) -> RouteStop | None:
    if route_stop_id is None:
        return None
    route_stop = db.get(RouteStop, route_stop_id)
    if not route_stop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Route stop not found")
    if route and route_stop.route_id != route.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Route stop does not belong to route")
    if route_stop.source_type != source_type:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Route stop source_type mismatch")
    if source_type == OperationalSourceType.HOUSEHOLD and route_stop.household_id != household_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Route stop household does not match task source")
    if source_type == OperationalSourceType.BULK_GENERATOR and route_stop.bulk_generator_id != bulk_generator_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Route stop bulk generator does not match task source")
    return route_stop


def validate_shift_scope(db: Session, shift_id: UUID | None, city_id: UUID, ward_id: UUID, zone_id: UUID | None) -> Shift | None:
    if shift_id is None:
        return None
    shift = db.get(Shift, shift_id)
    if not shift:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shift not found")
    if shift.city_id != city_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Shift city does not match task city")
    if ward_id and shift.ward_id and shift.ward_id != ward_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Shift ward does not match task ward")
    if zone_id and shift.zone_id and shift.zone_id != zone_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Shift zone does not match task zone")
    return shift


def validate_worker_assignment(db: Session, worker_profile_id: UUID | None, city_id: UUID, ward_id: UUID | None) -> WorkerProfile | None:
    if worker_profile_id is None:
        return None
    worker = db.get(WorkerProfile, worker_profile_id)
    if not worker:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Worker profile not found")
    if not worker.is_active or worker.employment_status != EmploymentStatus.ACTIVE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Worker is not active")
    if worker.city_id != city_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Assigned worker city mismatch")
    if ward_id and worker.ward_id and worker.ward_id != ward_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Assigned worker ward mismatch")
    return worker


def validate_vehicle_assignment(db: Session, vehicle_id: UUID | None, city_id: UUID, ward_id: UUID | None) -> Vehicle | None:
    if vehicle_id is None:
        return None
    vehicle = db.get(Vehicle, vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")
    if not vehicle.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Vehicle is inactive")
    if vehicle.city_id != city_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Assigned vehicle city mismatch")
    if ward_id and vehicle.ward_id and vehicle.ward_id != ward_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Assigned vehicle ward mismatch")
    return vehicle


def ensure_worker_user_role(db: Session, user_id: UUID) -> None:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    has_worker_role = db.scalar(
        select(UserRole.id)
        .join(Role, Role.id == UserRole.role_id)
        .where(UserRole.user_id == user_id, Role.code == "WORKER", Role.is_active.is_(True))
    )
    if not has_worker_role:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User must have active WORKER role")


def validate_pickup_transition(current_status: PickupStatus, target_status: PickupStatus) -> None:
    allowed = {
        PickupStatus.PENDING: {PickupStatus.IN_PROGRESS, PickupStatus.MISSED},
        PickupStatus.IN_PROGRESS: {PickupStatus.COMPLETED, PickupStatus.MISSED},
    }
    if target_status not in allowed.get(current_status, set()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid pickup task transition: {current_status.value} -> {target_status.value}",
        )


def create_pickup_log_internal(
    db: Session,
    pickup_task_id: UUID,
    worker_profile_id: UUID,
    event_type,
    latitude=None,
    longitude=None,
    notes: str | None = None,
    weight_kg: float | None = None,
    photo_url: str | None = None,
    actor_id: UUID | None = None,
) -> PickupLog:
    log = PickupLog(
        pickup_task_id=pickup_task_id,
        worker_profile_id=worker_profile_id,
        event_type=event_type,
        event_at=now_utc(),
        latitude=latitude,
        longitude=longitude,
        notes=notes,
        weight_kg=weight_kg,
        photo_url=photo_url,
    )
    if actor_id:
        log.created_by = actor_id
        log.updated_by = actor_id
    db.add(log)
    db.flush()
    return log


def get_worker_profile_for_user(db: Session, user_id: UUID) -> WorkerProfile | None:
    return db.scalar(select(WorkerProfile).where(WorkerProfile.user_id == user_id))


def get_pickup_task(db: Session, pickup_task_id: UUID) -> PickupTask:
    task = db.get(PickupTask, pickup_task_id)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pickup task not found")
    return task
