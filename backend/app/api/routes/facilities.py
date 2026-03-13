from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.routes.processing_scope_common import apply_scope_filters, enforce_scope, has_any_role
from app.core.dependencies import get_current_active_user, get_user_role_codes, require_roles
from app.db.session import get_db
from app.models.enums import FacilityType
from app.models.user import User
from app.schemas.processing_facility import ProcessingFacilityCreate, ProcessingFacilityListItem, ProcessingFacilityRead
from app.services.processing_facility_service import create_processing_facility, get_processing_facility, list_processing_facilities

router = APIRouter(prefix="/facilities", tags=["facilities"])


@router.post("", response_model=ProcessingFacilityRead)
def create_facility_endpoint(
    payload: ProcessingFacilityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER")),
) -> ProcessingFacilityRead:
    role_codes = get_user_role_codes(current_user)
    enforce_scope(current_user, role_codes, payload.city_id, payload.ward_id)
    return create_processing_facility(db, payload, current_user.id)


@router.get("", response_model=list[ProcessingFacilityListItem])
def list_facilities_endpoint(
    city_id: UUID | None = None,
    ward_id: UUID | None = None,
    zone_id: UUID | None = None,
    facility_type: FacilityType | None = None,
    is_active: bool | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> list[ProcessingFacilityListItem]:
    role_codes = get_user_role_codes(current_user)
    if not has_any_role(role_codes, {"SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "SANITATION_SUPERVISOR", "PROCESSOR", "AUDITOR"}) and not current_user.is_superuser:
        return []

    city_id, ward_id = apply_scope_filters(current_user, role_codes, city_id, ward_id)
    return list_processing_facilities(db, city_id=city_id, ward_id=ward_id, zone_id=zone_id, facility_type=facility_type, is_active=is_active)


@router.get("/{facility_id}", response_model=ProcessingFacilityRead)
def get_facility_endpoint(
    facility_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> ProcessingFacilityRead:
    role_codes = get_user_role_codes(current_user)
    facility = get_processing_facility(db, facility_id)
    enforce_scope(current_user, role_codes, facility.city_id, facility.ward_id)
    return facility
