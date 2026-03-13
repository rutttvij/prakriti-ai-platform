from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.routes.operations_common import enforce_operational_scope, is_manager, scope_list_filters
from app.core.dependencies import get_current_active_user, get_user_role_codes, require_roles
from app.db.session import get_db
from app.models.enums import RouteType
from app.models.user import User
from app.schemas.route import RouteCreate, RouteListItem, RouteRead
from app.services.route_service import create_route, get_route, list_routes

router = APIRouter(prefix="/routes", tags=["routes"])


@router.post("", response_model=RouteRead)
def create_route_endpoint(
    payload: RouteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "SANITATION_SUPERVISOR")),
) -> RouteRead:
    role_codes = get_user_role_codes(current_user)
    enforce_operational_scope(current_user, role_codes, payload.city_id, payload.ward_id)
    return create_route(db, payload, current_user.id)


@router.get("", response_model=list[RouteListItem])
def list_routes_endpoint(
    city_id: UUID | None = None,
    ward_id: UUID | None = None,
    zone_id: UUID | None = None,
    route_type: RouteType | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> list[RouteListItem]:
    role_codes = get_user_role_codes(current_user)
    if not is_manager(current_user, role_codes):
        return []

    city_id, ward_id = scope_list_filters(current_user, role_codes, city_id, ward_id)
    return list_routes(db, city_id=city_id, ward_id=ward_id, zone_id=zone_id, route_type=route_type)


@router.get("/{route_id}", response_model=RouteRead)
def get_route_endpoint(
    route_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "SANITATION_SUPERVISOR")),
) -> RouteRead:
    role_codes = get_user_role_codes(current_user)
    route = get_route(db, route_id)
    enforce_operational_scope(current_user, role_codes, route.city_id, route.ward_id)
    return route
