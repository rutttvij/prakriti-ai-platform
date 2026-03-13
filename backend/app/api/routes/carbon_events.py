from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.routes.carbon_scope_common import (
    apply_scope_filters,
    enforce_city_ward_scope,
    enforce_processor_facility_scope,
)
from app.core.dependencies import get_user_role_codes, require_roles
from app.db.session import get_db
from app.models.enums import CarbonCalculationStatus, CarbonEventType, WasteType
from app.models.user import User
from app.schemas.carbon_event import CarbonEventCreate, CarbonEventListItem, CarbonEventRead
from app.services.carbon_accounting_common import derive_scope_from_carbon_event
from app.services.carbon_event_service import create_carbon_event, get_carbon_event, list_carbon_events

router = APIRouter(prefix="/carbon-events", tags=["carbon-events"])


@router.post("", response_model=CarbonEventRead)
def create_carbon_event_endpoint(
    payload: CarbonEventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SUPER_ADMIN", "CITY_ADMIN", "PROCESSOR")),
) -> CarbonEventRead:
    role_codes = get_user_role_codes(current_user)
    event = create_carbon_event(db, payload, current_user.id)
    city_id, ward_id, facility_id = derive_scope_from_carbon_event(event)

    if city_id is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unable to derive city scope for carbon event")

    enforce_city_ward_scope(current_user, role_codes, city_id, ward_id)
    enforce_processor_facility_scope(current_user, role_codes, facility_id, city_id, ward_id)
    return event


@router.get("", response_model=list[CarbonEventListItem])
def list_carbon_events_endpoint(
    city_id: UUID | None = None,
    ward_id: UUID | None = None,
    batch_id: UUID | None = None,
    facility_id: UUID | None = None,
    event_type: CarbonEventType | None = None,
    waste_type: WasteType | None = None,
    calculation_status: CarbonCalculationStatus | None = None,
    event_date_from: date | None = None,
    event_date_to: date | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "AUDITOR", "PROCESSOR")),
) -> list[CarbonEventListItem]:
    role_codes = get_user_role_codes(current_user)
    city_id, ward_id = apply_scope_filters(current_user, role_codes, city_id, ward_id)
    events = list_carbon_events(
        db,
        city_id=city_id,
        ward_id=ward_id,
        batch_id=batch_id,
        facility_id=facility_id,
        event_type=event_type,
        waste_type=waste_type,
        calculation_status=calculation_status,
        event_date_from=event_date_from,
        event_date_to=event_date_to,
    )

    scoped = []
    for event in events:
        ev_city_id, ev_ward_id, ev_facility_id = derive_scope_from_carbon_event(event)
        if ev_city_id is None:
            continue
        try:
            enforce_city_ward_scope(current_user, role_codes, ev_city_id, ev_ward_id)
            enforce_processor_facility_scope(current_user, role_codes, ev_facility_id, ev_city_id, ev_ward_id)
            scoped.append(event)
        except HTTPException:
            continue
    return scoped


@router.get("/{event_id}", response_model=CarbonEventRead)
def get_carbon_event_endpoint(
    event_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "AUDITOR", "PROCESSOR")),
) -> CarbonEventRead:
    role_codes = get_user_role_codes(current_user)
    event = get_carbon_event(db, event_id)
    city_id, ward_id, facility_id = derive_scope_from_carbon_event(event)
    if city_id is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unable to derive city scope for carbon event")
    enforce_city_ward_scope(current_user, role_codes, city_id, ward_id)
    enforce_processor_facility_scope(current_user, role_codes, facility_id, city_id, ward_id)
    return event
