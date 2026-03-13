from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_active_user, get_user_role_codes, require_roles
from app.db.session import get_db
from app.models.city import City
from app.models.user import User
from app.schemas.ward import WardCreate, WardRead
from app.services.ward_service import create_ward, list_wards

router = APIRouter(prefix="/wards", tags=["wards"])


@router.post("", response_model=WardRead)
def create_ward_endpoint(
    payload: WardCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SUPER_ADMIN", "CITY_ADMIN")),
) -> WardRead:
    role_codes = get_user_role_codes(current_user)
    if "SUPER_ADMIN" not in role_codes and not current_user.is_superuser:
        city = db.get(City, payload.city_id)
        if not city:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="City not found")
        if current_user.city_id and payload.city_id != current_user.city_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="CITY_ADMIN can only manage own city")

    return create_ward(db, payload, current_user.id)


@router.get("", response_model=list[WardRead])
def list_wards_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> list[WardRead]:
    role_codes = get_user_role_codes(current_user)
    if current_user.is_superuser or "SUPER_ADMIN" in role_codes:
        return list_wards(db)
    if "WARD_OFFICER" in role_codes and current_user.ward_id:
        return list_wards(db, ward_id=current_user.ward_id)
    if "CITY_ADMIN" in role_codes and current_user.city_id:
        return list_wards(db, city_id=current_user.city_id)
    return []
