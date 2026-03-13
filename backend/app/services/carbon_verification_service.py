from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.models.carbon_event import CarbonEvent
from app.models.carbon_ledger_entry import CarbonLedgerEntry
from app.models.carbon_verification import CarbonVerification
from app.schemas.carbon_verification import CarbonVerificationCreate


def create_carbon_verification(db: Session, payload: CarbonVerificationCreate, actor_id: UUID | None = None) -> CarbonVerification:
    if payload.carbon_event_id is None and payload.ledger_entry_id is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="At least one of carbon_event_id or ledger_entry_id is required")

    if payload.carbon_event_id:
        event = db.get(CarbonEvent, payload.carbon_event_id)
        if not event:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Carbon event not found")

    if payload.ledger_entry_id:
        entry = db.get(CarbonLedgerEntry, payload.ledger_entry_id)
        if not entry:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Carbon ledger entry not found")

    verification = CarbonVerification(**payload.model_dump())
    if actor_id:
        verification.created_by = actor_id
        verification.updated_by = actor_id

    db.add(verification)
    db.commit()
    db.refresh(verification)
    return verification


def list_carbon_verifications(
    db: Session,
    carbon_event_id: UUID | None = None,
    ledger_entry_id: UUID | None = None,
    verification_status=None,
) -> list[CarbonVerification]:
    query: Select[tuple[CarbonVerification]] = select(CarbonVerification).order_by(CarbonVerification.created_at.desc())
    if carbon_event_id:
        query = query.where(CarbonVerification.carbon_event_id == carbon_event_id)
    if ledger_entry_id:
        query = query.where(CarbonVerification.ledger_entry_id == ledger_entry_id)
    if verification_status:
        query = query.where(CarbonVerification.verification_status == verification_status)
    return list(db.scalars(query).all())


def get_carbon_verification(db: Session, verification_id: UUID) -> CarbonVerification:
    verification = db.get(CarbonVerification, verification_id)
    if not verification:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Carbon verification not found")
    return verification
