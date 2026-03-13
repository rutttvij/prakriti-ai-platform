from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_active_user, get_user_role_codes, require_roles
from app.db.session import get_db
from app.models.ward import Ward
from app.models.zone import Zone
from app.models.user import User
from app.schemas.zone import ZoneCreate, ZoneRead
from app.services.zone_service import create_zone, list_zones

router = APIRouter(prefix="/zones", tags=["zones"])


@router.post("", response_model=ZoneRead)
def create_zone_endpoint(
    payload: ZoneCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER")),
) -> ZoneRead:
    role_codes = get_user_role_codes(current_user)
    ward = db.get(Ward, payload.ward_id)
    if not ward:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ward not found")

    if not current_user.is_superuser and "SUPER_ADMIN" not in role_codes:
        if "CITY_ADMIN" in role_codes:
            if not current_user.city_id or ward.city_id != current_user.city_id:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="CITY_ADMIN can only manage own city")
        elif "WARD_OFFICER" in role_codes:
            if not current_user.ward_id or payload.ward_id != current_user.ward_id:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="WARD_OFFICER can only manage own ward")

    return create_zone(db, payload, current_user.id)


@router.get("", response_model=list[ZoneRead])
def list_zones_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> list[ZoneRead]:
    role_codes = get_user_role_codes(current_user)
    if current_user.is_superuser or "SUPER_ADMIN" in role_codes:
        return list_zones(db)
    if "WARD_OFFICER" in role_codes and current_user.ward_id:
        return list_zones(db, ward_id=current_user.ward_id)
    if "CITY_ADMIN" in role_codes and current_user.city_id:
        ward_ids = list(db.scalars(select(Ward.id).where(Ward.city_id == current_user.city_id)).all())
        if not ward_ids:
            return []
        return list_zones(db, ward_ids=ward_ids)
    return []
