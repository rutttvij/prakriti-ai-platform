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
from app.models.enums import ComplianceStatus, GeneratorType, OnboardingStatus
from app.models.user import User
from app.schemas.bulk_generator import (
    BulkWasteGeneratorCreate,
    BulkWasteGeneratorListItem,
    BulkWasteGeneratorRead,
)
from app.services.bulk_generator_service import (
    create_bulk_generator,
    get_bulk_generator,
    list_bulk_generators,
)

router = APIRouter(prefix="/bulk-generators", tags=["bulk-generators"])


@router.post("", response_model=BulkWasteGeneratorRead)
def create_bulk_generator_endpoint(
    payload: BulkWasteGeneratorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER")),
) -> BulkWasteGeneratorRead:
    role_codes = get_user_role_codes(current_user)
    enforce_city_ward_scope(current_user, role_codes, payload.city_id, payload.ward_id)
    return create_bulk_generator(db, payload, current_user.id)


@router.get("", response_model=list[BulkWasteGeneratorListItem])
def list_bulk_generators_endpoint(
    city_id: UUID | None = None,
    ward_id: UUID | None = None,
    zone_id: UUID | None = None,
    generator_type: GeneratorType | None = None,
    compliance_status: ComplianceStatus | None = None,
    onboarding_status: OnboardingStatus | None = None,
    is_active: bool | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> list[BulkWasteGeneratorListItem]:
    role_codes = get_user_role_codes(current_user)
    if not is_super_admin(current_user, role_codes):
        if "CITY_ADMIN" in role_codes and current_user.city_id:
            city_id = current_user.city_id
        elif "WARD_OFFICER" in role_codes and current_user.ward_id:
            ward_id = current_user.ward_id
            city_id = current_user.city_id
        else:
            return []

    return list_bulk_generators(
        db,
        city_id=city_id,
        ward_id=ward_id,
        zone_id=zone_id,
        generator_type=generator_type,
        compliance_status=compliance_status,
        onboarding_status=onboarding_status,
        is_active=is_active,
    )


@router.get("/{generator_id}", response_model=BulkWasteGeneratorRead)
def get_bulk_generator_endpoint(
    generator_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER")),
) -> BulkWasteGeneratorRead:
    generator = get_bulk_generator(db, generator_id)
    role_codes = get_user_role_codes(current_user)
    enforce_city_ward_scope_for_entity(current_user, role_codes, generator.city_id, generator.ward_id)
    return generator
