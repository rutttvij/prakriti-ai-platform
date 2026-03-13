from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_active_user, require_roles
from app.db.session import get_db
from app.models.enums import ProcessType, WasteType
from app.models.user import User
from app.schemas.emission_factor import EmissionFactorCreate, EmissionFactorListItem, EmissionFactorRead
from app.services.emission_factor_service import create_emission_factor, get_emission_factor_by_id, list_emission_factors

router = APIRouter(prefix="/emission-factors", tags=["emission-factors"])


@router.post("", response_model=EmissionFactorRead)
def create_emission_factor_endpoint(
    payload: EmissionFactorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SUPER_ADMIN", "CITY_ADMIN")),
) -> EmissionFactorRead:
    return create_emission_factor(db, payload, current_user.id)


@router.get("", response_model=list[EmissionFactorListItem])
def list_emission_factors_endpoint(
    waste_type: WasteType | None = None,
    process_type: ProcessType | None = None,
    active_on: date | None = None,
    is_active: bool | None = None,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "AUDITOR", "PROCESSOR")),
) -> list[EmissionFactorListItem]:
    return list_emission_factors(
        db,
        waste_type=waste_type,
        process_type=process_type,
        active_on=active_on,
        is_active=is_active,
    )


@router.get("/{factor_id}", response_model=EmissionFactorRead)
def get_emission_factor_endpoint(
    factor_id: UUID,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "AUDITOR", "PROCESSOR")),
) -> EmissionFactorRead:
    return get_emission_factor_by_id(db, factor_id)
