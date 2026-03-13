from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.routes.operations_common import enforce_operational_scope, is_manager
from app.core.dependencies import get_current_active_user, get_user_role_codes, require_roles
from app.db.session import get_db
from app.models.enums import OperationalSourceType
from app.models.user import User
from app.schemas.route_stop import RouteStopCreate, RouteStopListItem, RouteStopRead
from app.services.route_service import get_route
from app.services.route_stop_service import create_route_stop, get_route_stop, list_route_stops

router = APIRouter(prefix="/route-stops", tags=["route-stops"])


@router.post("", response_model=RouteStopRead)
def create_route_stop_endpoint(
    payload: RouteStopCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "SANITATION_SUPERVISOR")),
) -> RouteStopRead:
    role_codes = get_user_role_codes(current_user)
    route = get_route(db, payload.route_id)
    enforce_operational_scope(current_user, role_codes, route.city_id, route.ward_id)
    return create_route_stop(db, payload, current_user.id)


@router.get("", response_model=list[RouteStopListItem])
def list_route_stops_endpoint(
    route_id: UUID | None = None,
    source_type: OperationalSourceType | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> list[RouteStopListItem]:
    role_codes = get_user_role_codes(current_user)
    if not is_manager(current_user, role_codes):
        return []

    stops = list_route_stops(db, route_id=route_id, source_type=source_type)
    if current_user.is_superuser or "SUPER_ADMIN" in role_codes:
        return stops

    scoped = []
    for stop in stops:
        route = stop.route
        if route is None:
            continue
        try:
            enforce_operational_scope(current_user, role_codes, route.city_id, route.ward_id)
            scoped.append(stop)
        except HTTPException:
            continue
    return scoped


@router.get("/{route_stop_id}", response_model=RouteStopRead)
def get_route_stop_endpoint(
    route_stop_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "SANITATION_SUPERVISOR")),
) -> RouteStopRead:
    role_codes = get_user_role_codes(current_user)
    stop = get_route_stop(db, route_stop_id)
    enforce_operational_scope(current_user, role_codes, stop.route.city_id, stop.route.ward_id)
    return stop
