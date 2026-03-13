from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.routes.carbon_scope_common import enforce_city_ward_scope, enforce_processor_facility_scope
from app.core.dependencies import get_user_role_codes, require_roles
from app.db.session import get_db
from app.models.enums import VerificationStatus
from app.models.user import User
from app.schemas.carbon_verification import CarbonVerificationCreate, CarbonVerificationListItem, CarbonVerificationRead
from app.services.carbon_accounting_common import derive_scope_from_carbon_event
from app.services.carbon_verification_service import create_carbon_verification, get_carbon_verification, list_carbon_verifications

router = APIRouter(prefix="/carbon-verifications", tags=["carbon-verifications"])


@router.post("", response_model=CarbonVerificationRead)
def create_carbon_verification_endpoint(
    payload: CarbonVerificationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SUPER_ADMIN", "CITY_ADMIN", "AUDITOR")),
) -> CarbonVerificationRead:
    role_codes = get_user_role_codes(current_user)
    verification = create_carbon_verification(db, payload, current_user.id)

    if verification.carbon_event:
        city_id, ward_id, _ = derive_scope_from_carbon_event(verification.carbon_event)
        if city_id is not None:
            enforce_city_ward_scope(current_user, role_codes, city_id, ward_id)

    return verification


@router.get("", response_model=list[CarbonVerificationListItem])
def list_carbon_verifications_endpoint(
    carbon_event_id: UUID | None = None,
    ledger_entry_id: UUID | None = None,
    verification_status: VerificationStatus | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "AUDITOR", "PROCESSOR")),
) -> list[CarbonVerificationListItem]:
    role_codes = get_user_role_codes(current_user)
    records = list_carbon_verifications(
        db,
        carbon_event_id=carbon_event_id,
        ledger_entry_id=ledger_entry_id,
        verification_status=verification_status,
    )

    scoped = []
    for record in records:
        try:
            if record.carbon_event:
                city_id, ward_id, facility_id = derive_scope_from_carbon_event(record.carbon_event)
                if city_id is not None:
                    enforce_city_ward_scope(current_user, role_codes, city_id, ward_id)
                    enforce_processor_facility_scope(current_user, role_codes, facility_id, city_id, ward_id)
            elif record.ledger_entry and record.ledger_entry.carbon_event:
                city_id, ward_id, facility_id = derive_scope_from_carbon_event(record.ledger_entry.carbon_event)
                if city_id is not None:
                    enforce_city_ward_scope(current_user, role_codes, city_id, ward_id)
                    enforce_processor_facility_scope(current_user, role_codes, facility_id, city_id, ward_id)
            scoped.append(record)
        except HTTPException:
            continue
    return scoped


@router.get("/{verification_id}", response_model=CarbonVerificationRead)
def get_carbon_verification_endpoint(
    verification_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "AUDITOR", "PROCESSOR")),
) -> CarbonVerificationRead:
    role_codes = get_user_role_codes(current_user)
    record = get_carbon_verification(db, verification_id)

    if record.carbon_event:
        city_id, ward_id, facility_id = derive_scope_from_carbon_event(record.carbon_event)
        if city_id is not None:
            enforce_city_ward_scope(current_user, role_codes, city_id, ward_id)
            enforce_processor_facility_scope(current_user, role_codes, facility_id, city_id, ward_id)

    return record
