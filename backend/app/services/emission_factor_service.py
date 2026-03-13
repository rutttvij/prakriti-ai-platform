from datetime import date
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.models.emission_factor import EmissionFactor
from app.schemas.emission_factor import EmissionFactorCreate


def create_emission_factor(db: Session, payload: EmissionFactorCreate, actor_id: UUID | None = None) -> EmissionFactor:
    existing = db.scalar(select(EmissionFactor).where(EmissionFactor.factor_code == payload.factor_code))
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Factor code already exists")

    if payload.effective_to and payload.effective_to < payload.effective_from:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="effective_to cannot be before effective_from")

    factor = EmissionFactor(**payload.model_dump())
    if actor_id:
        factor.created_by = actor_id
        factor.updated_by = actor_id

    db.add(factor)
    db.commit()
    db.refresh(factor)
    return factor


def list_emission_factors(
    db: Session,
    waste_type=None,
    process_type=None,
    active_on: date | None = None,
    is_active: bool | None = None,
) -> list[EmissionFactor]:
    query: Select[tuple[EmissionFactor]] = select(EmissionFactor).order_by(EmissionFactor.effective_from.desc(), EmissionFactor.created_at.desc())
    if waste_type:
        query = query.where(EmissionFactor.waste_type == waste_type)
    if process_type:
        query = query.where(EmissionFactor.process_type == process_type)
    if is_active is not None:
        query = query.where(EmissionFactor.is_active == is_active)
    if active_on:
        query = query.where(EmissionFactor.effective_from <= active_on)
        query = query.where((EmissionFactor.effective_to.is_(None)) | (EmissionFactor.effective_to >= active_on))
    return list(db.scalars(query).all())


def get_emission_factor_by_id(db: Session, factor_id: UUID) -> EmissionFactor:
    factor = db.get(EmissionFactor, factor_id)
    if not factor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Emission factor not found")
    return factor
