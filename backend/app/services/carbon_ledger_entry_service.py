from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.models.carbon_event import CarbonEvent
from app.models.carbon_ledger_entry import CarbonLedgerEntry
from app.models.enums import DebitCreditDirection, LedgerEntryType
from app.schemas.carbon_ledger_entry import CarbonLedgerEntryCreate
from app.services.carbon_accounting_common import derive_scope_from_carbon_event


def create_carbon_ledger_entry(db: Session, payload: CarbonLedgerEntryCreate, actor_id: UUID | None = None) -> CarbonLedgerEntry:
    existing = db.scalar(select(CarbonLedgerEntry).where(CarbonLedgerEntry.ledger_entry_code == payload.ledger_entry_code))
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Ledger entry code already exists")

    event = db.get(CarbonEvent, payload.carbon_event_id)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Carbon event not found")

    if payload.quantity_kgco2e <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="quantity_kgco2e must be positive")

    if payload.entry_type == LedgerEntryType.EMISSION and payload.debit_credit_direction != DebitCreditDirection.DEBIT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="EMISSION ledger entries must use DEBIT direction",
        )
    if (
        payload.entry_type == LedgerEntryType.AVOIDED_EMISSION
        and payload.debit_credit_direction != DebitCreditDirection.CREDIT
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="AVOIDED_EMISSION ledger entries must use CREDIT direction",
        )

    derived_city_id, derived_ward_id, _ = derive_scope_from_carbon_event(event)

    entry = CarbonLedgerEntry(
        **payload.model_dump(),
        city_id=payload.city_id or derived_city_id,
        ward_id=payload.ward_id or derived_ward_id,
    )
    if actor_id:
        entry.created_by = actor_id
        entry.updated_by = actor_id

    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def list_carbon_ledger_entries(
    db: Session,
    city_id: UUID | None = None,
    ward_id: UUID | None = None,
    period_month: int | None = None,
    period_year: int | None = None,
    verification_status=None,
    entry_type=None,
) -> list[CarbonLedgerEntry]:
    query: Select[tuple[CarbonLedgerEntry]] = select(CarbonLedgerEntry).order_by(CarbonLedgerEntry.recorded_at.desc())
    if city_id:
        query = query.where(CarbonLedgerEntry.city_id == city_id)
    if ward_id:
        query = query.where(CarbonLedgerEntry.ward_id == ward_id)
    if period_month:
        query = query.where(CarbonLedgerEntry.period_month == period_month)
    if period_year:
        query = query.where(CarbonLedgerEntry.period_year == period_year)
    if verification_status:
        query = query.where(CarbonLedgerEntry.verification_status == verification_status)
    if entry_type:
        query = query.where(CarbonLedgerEntry.entry_type == entry_type)
    return list(db.scalars(query).all())


def get_carbon_ledger_entry(db: Session, entry_id: UUID) -> CarbonLedgerEntry:
    entry = db.get(CarbonLedgerEntry, entry_id)
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Carbon ledger entry not found")
    return entry
