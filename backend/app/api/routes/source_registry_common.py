from fastapi import HTTPException, status

from app.models.user import User


def is_super_admin(user: User, role_codes: set[str]) -> bool:
    return user.is_superuser or "SUPER_ADMIN" in role_codes


def enforce_city_ward_scope(user: User, role_codes: set[str], city_id, ward_id) -> None:
    if is_super_admin(user, role_codes):
        return
    if "CITY_ADMIN" in role_codes:
        if not user.city_id or city_id != user.city_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="CITY_ADMIN can only manage own city")
        return
    if "WARD_OFFICER" in role_codes:
        if not user.ward_id or ward_id != user.ward_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="WARD_OFFICER can only manage own ward")
        return
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient role permissions")


def enforce_city_ward_scope_for_entity(user: User, role_codes: set[str], entity_city_id, entity_ward_id) -> None:
    enforce_city_ward_scope(user, role_codes, entity_city_id, entity_ward_id)
