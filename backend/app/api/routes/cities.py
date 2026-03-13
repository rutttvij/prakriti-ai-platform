from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_active_user, get_user_role_codes, require_roles
from app.db.session import get_db
from app.models.user import User
from app.schemas.city import CityCreate, CityRead
from app.services.city_service import create_city, list_cities

router = APIRouter(prefix="/cities", tags=["cities"])


@router.post("", response_model=CityRead)
def create_city_endpoint(
    payload: CityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SUPER_ADMIN", "CITY_ADMIN")),
) -> CityRead:
    role_codes = get_user_role_codes(current_user)
    if "SUPER_ADMIN" not in role_codes and not current_user.is_superuser:
        if current_user.organization_id and payload.organization_id != current_user.organization_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="CITY_ADMIN can only create cities in their organization",
            )

    return create_city(db, payload, current_user.id)


@router.get("", response_model=list[CityRead])
def list_cities_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> list[CityRead]:
    role_codes = get_user_role_codes(current_user)
    if current_user.is_superuser or "SUPER_ADMIN" in role_codes:
        return list_cities(db)
    if "CITY_ADMIN" in role_codes and current_user.city_id:
        return list_cities(db, city_id=current_user.city_id)
    if current_user.organization_id:
        return list_cities(db, organization_id=current_user.organization_id)
    return []
