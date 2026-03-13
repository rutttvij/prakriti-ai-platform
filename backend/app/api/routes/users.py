from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_active_user, get_user_role_codes, require_roles
from app.db.session import get_db
from app.models.ward import Ward
from app.models.zone import Zone
from app.models.user import User
from app.schemas.user import UserCreate, UserRead
from app.services.user_service import create_user, list_users, to_user_read

router = APIRouter(prefix="/users", tags=["users"])


@router.post("", response_model=UserRead)
def create_user_endpoint(
    payload: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER")),
) -> UserRead:
    role_codes = get_user_role_codes(current_user)

    if "SUPER_ADMIN" not in role_codes and not current_user.is_superuser:
        if "CITY_ADMIN" in role_codes:
            if payload.city_id != current_user.city_id:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="CITY_ADMIN can only create users in own city")
            if payload.organization_id and payload.organization_id != current_user.organization_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="CITY_ADMIN can only create users in own organization",
                )
        elif "WARD_OFFICER" in role_codes:
            if payload.ward_id != current_user.ward_id:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="WARD_OFFICER can only create users in own ward")
            if payload.city_id and payload.city_id != current_user.city_id:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="WARD_OFFICER can only create users in own city")

        if "SUPER_ADMIN" in payload.role_codes:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only SUPER_ADMIN can assign SUPER_ADMIN role")

    if payload.zone_id and payload.ward_id:
        zone = db.get(Zone, payload.zone_id)
        if not zone:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Zone not found")
        if zone.ward_id != payload.ward_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Zone does not belong to ward")

    return to_user_read(create_user(db, payload, current_user.id))


@router.get("", response_model=list[UserRead])
def list_users_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> list[UserRead]:
    role_codes = get_user_role_codes(current_user)
    if current_user.is_superuser or "SUPER_ADMIN" in role_codes:
        return [to_user_read(user) for user in list_users(db)]
    if "CITY_ADMIN" in role_codes and current_user.city_id:
        return [to_user_read(user) for user in list_users(db, city_id=current_user.city_id)]
    if "WARD_OFFICER" in role_codes and current_user.ward_id:
        return [to_user_read(user) for user in list_users(db, ward_id=current_user.ward_id)]
    return [to_user_read(current_user)]
