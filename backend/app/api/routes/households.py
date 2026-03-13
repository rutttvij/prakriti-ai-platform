from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.routes.source_registry_common import (
    enforce_city_ward_scope,
    enforce_city_ward_scope_for_entity,
    is_super_admin,
)
from app.core.dependencies import get_current_active_user, get_user_role_codes, require_roles
from app.db.session import get_db
from app.models.enums import OnboardingStatus
from app.models.user import User
from app.schemas.household import HouseholdCreate, HouseholdListItem, HouseholdRead
from app.services.household_service import create_household, get_household, list_households

router = APIRouter(prefix="/households", tags=["households"])


@router.post("", response_model=HouseholdRead)
def create_household_endpoint(
    payload: HouseholdCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER")),
) -> HouseholdRead:
    role_codes = get_user_role_codes(current_user)
    enforce_city_ward_scope(current_user, role_codes, payload.city_id, payload.ward_id)
    return create_household(db, payload, current_user.id)


@router.get("", response_model=list[HouseholdListItem])
def list_households_endpoint(
    city_id: UUID | None = None,
    ward_id: UUID | None = None,
    zone_id: UUID | None = None,
    onboarding_status: OnboardingStatus | None = None,
    is_active: bool | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> list[HouseholdListItem]:
    role_codes = get_user_role_codes(current_user)
    if not is_super_admin(current_user, role_codes):
        if "CITY_ADMIN" in role_codes and current_user.city_id:
            city_id = current_user.city_id
        elif "WARD_OFFICER" in role_codes and current_user.ward_id:
            ward_id = current_user.ward_id
            city_id = current_user.city_id
        else:
            return []

    return list_households(
        db,
        city_id=city_id,
        ward_id=ward_id,
        zone_id=zone_id,
        onboarding_status=onboarding_status,
        is_active=is_active,
    )


@router.get("/{household_id}", response_model=HouseholdRead)
def get_household_endpoint(
    household_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER")),
) -> HouseholdRead:
    household = get_household(db, household_id)
    role_codes = get_user_role_codes(current_user)
    enforce_city_ward_scope_for_entity(current_user, role_codes, household.city_id, household.ward_id)
    return household
