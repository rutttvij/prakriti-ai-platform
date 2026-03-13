from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import require_roles
from app.db.session import get_db
from app.models.user import User
from app.schemas.address import AddressCreate, AddressRead
from app.services.address_service import create_address, list_addresses

router = APIRouter(prefix="/addresses", tags=["addresses"])


@router.post("", response_model=AddressRead)
def create_address_endpoint(
    payload: AddressCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER")),
) -> AddressRead:
    return create_address(db, payload, current_user.id)


@router.get("", response_model=list[AddressRead])
def list_addresses_endpoint(
    is_active: bool | None = None,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER")),
) -> list[AddressRead]:
    return list_addresses(db, is_active=is_active)
