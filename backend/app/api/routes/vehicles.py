from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.routes.operations_common import enforce_operational_scope, is_manager, scope_list_filters
from app.core.dependencies import get_current_active_user, get_user_role_codes, require_roles
from app.db.session import get_db
from app.models.enums import OwnershipType, VehicleType
from app.models.user import User
from app.schemas.vehicle import VehicleCreate, VehicleListItem, VehicleRead
from app.services.vehicle_service import create_vehicle, get_vehicle, list_vehicles

router = APIRouter(prefix="/vehicles", tags=["vehicles"])


@router.post("", response_model=VehicleRead)
def create_vehicle_endpoint(
    payload: VehicleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "SANITATION_SUPERVISOR")),
) -> VehicleRead:
    role_codes = get_user_role_codes(current_user)
    enforce_operational_scope(current_user, role_codes, payload.city_id, payload.ward_id)
    return create_vehicle(db, payload, current_user.id)


@router.get("", response_model=list[VehicleListItem])
def list_vehicles_endpoint(
    city_id: UUID | None = None,
    ward_id: UUID | None = None,
    zone_id: UUID | None = None,
    vehicle_type: VehicleType | None = None,
    ownership_type: OwnershipType | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> list[VehicleListItem]:
    role_codes = get_user_role_codes(current_user)
    if not is_manager(current_user, role_codes):
        return []

    city_id, ward_id = scope_list_filters(current_user, role_codes, city_id, ward_id)
    return list_vehicles(
        db,
        city_id=city_id,
        ward_id=ward_id,
        zone_id=zone_id,
        vehicle_type=vehicle_type,
        ownership_type=ownership_type,
    )


@router.get("/{vehicle_id}", response_model=VehicleRead)
def get_vehicle_endpoint(
    vehicle_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "SANITATION_SUPERVISOR")),
) -> VehicleRead:
    role_codes = get_user_role_codes(current_user)
    vehicle = get_vehicle(db, vehicle_id)
    enforce_operational_scope(current_user, role_codes, vehicle.city_id, vehicle.ward_id)
    return vehicle
