from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.address import Address
from app.schemas.address import AddressCreate


def create_address(db: Session, payload: AddressCreate, actor_id=None) -> Address:
    address = Address(**payload.model_dump())
    if actor_id:
        address.created_by = actor_id
        address.updated_by = actor_id

    db.add(address)
    db.commit()
    db.refresh(address)
    return address


def list_addresses(db: Session, is_active: bool | None = None) -> list[Address]:
    query = select(Address).order_by(Address.created_at.desc())
    if is_active is not None:
        query = query.where(Address.is_active == is_active)
    return list(db.scalars(query).all())
