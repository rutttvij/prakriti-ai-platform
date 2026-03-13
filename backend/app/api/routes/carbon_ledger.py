from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.routes.carbon_scope_common import apply_scope_filters, enforce_city_ward_scope, enforce_processor_facility_scope
from app.core.dependencies import get_user_role_codes, require_roles
from app.db.session import get_db
from app.models.enums import LedgerEntryType, VerificationStatus
from app.models.user import User
from app.schemas.carbon_ledger_entry import CarbonLedgerEntryCreate, CarbonLedgerEntryListItem, CarbonLedgerEntryRead
from app.services.carbon_accounting_common import derive_scope_from_carbon_event
from app.services.carbon_ledger_entry_service import create_carbon_ledger_entry, get_carbon_ledger_entry, list_carbon_ledger_entries

router = APIRouter(prefix="/carbon-ledger", tags=["carbon-ledger"])


@router.post("", response_model=CarbonLedgerEntryRead)
def create_carbon_ledger_endpoint(
    payload: CarbonLedgerEntryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SUPER_ADMIN", "CITY_ADMIN", "PROCESSOR")),
) -> CarbonLedgerEntryRead:
    role_codes = get_user_role_codes(current_user)
    entry = create_carbon_ledger_entry(db, payload, current_user.id)
    city_id = entry.city_id
    ward_id = entry.ward_id
    facility_id = None
    if entry.carbon_event:
        city_id, ward_id, facility_id = derive_scope_from_carbon_event(entry.carbon_event)

    if city_id is not None:
        enforce_city_ward_scope(current_user, role_codes, city_id, ward_id)
        enforce_processor_facility_scope(current_user, role_codes, facility_id, city_id, ward_id)

    return entry


@router.get("", response_model=list[CarbonLedgerEntryListItem])
def list_carbon_ledger_endpoint(
    city_id: UUID | None = None,
    ward_id: UUID | None = None,
    period_month: int | None = None,
    period_year: int | None = None,
    verification_status: VerificationStatus | None = None,
    entry_type: LedgerEntryType | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "AUDITOR", "PROCESSOR")),
) -> list[CarbonLedgerEntryListItem]:
    role_codes = get_user_role_codes(current_user)
    city_id, ward_id = apply_scope_filters(current_user, role_codes, city_id, ward_id)
    entries = list_carbon_ledger_entries(
        db,
        city_id=city_id,
        ward_id=ward_id,
        period_month=period_month,
        period_year=period_year,
        verification_status=verification_status,
        entry_type=entry_type,
    )

    scoped = []
    for entry in entries:
        e_city = entry.city_id
        e_ward = entry.ward_id
        facility_id = None
        if entry.carbon_event:
            e_city, e_ward, facility_id = derive_scope_from_carbon_event(entry.carbon_event)
        try:
            if e_city is not None:
                enforce_city_ward_scope(current_user, role_codes, e_city, e_ward)
                enforce_processor_facility_scope(current_user, role_codes, facility_id, e_city, e_ward)
            scoped.append(entry)
        except HTTPException:
            continue
    return scoped


@router.get("/{entry_id}", response_model=CarbonLedgerEntryRead)
def get_carbon_ledger_entry_endpoint(
    entry_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "AUDITOR", "PROCESSOR")),
) -> CarbonLedgerEntryRead:
    role_codes = get_user_role_codes(current_user)
    entry = get_carbon_ledger_entry(db, entry_id)

    city_id = entry.city_id
    ward_id = entry.ward_id
    facility_id = None
    if entry.carbon_event:
        city_id, ward_id, facility_id = derive_scope_from_carbon_event(entry.carbon_event)

    if city_id is not None:
        enforce_city_ward_scope(current_user, role_codes, city_id, ward_id)
        enforce_processor_facility_scope(current_user, role_codes, facility_id, city_id, ward_id)

    return entry
