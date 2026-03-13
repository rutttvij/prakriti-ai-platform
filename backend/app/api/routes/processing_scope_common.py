from fastapi import HTTPException, status

from app.models.user import User


def is_super_admin(user: User, role_codes: set[str]) -> bool:
    return user.is_superuser or "SUPER_ADMIN" in role_codes


def has_any_role(role_codes: set[str], allowed: set[str]) -> bool:
    return bool(role_codes.intersection(allowed))


def enforce_scope(user: User, role_codes: set[str], city_id, ward_id) -> None:
    if is_super_admin(user, role_codes):
        return

    if "CITY_ADMIN" in role_codes:
        if not user.city_id or user.city_id != city_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="CITY_ADMIN can only access own city")
        return

    if "WARD_OFFICER" in role_codes:
        if not user.ward_id or user.ward_id != ward_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="WARD_OFFICER can only access own ward")
        return

    if "SANITATION_SUPERVISOR" in role_codes or "PROCESSOR" in role_codes or "AUDITOR" in role_codes:
        if user.ward_id:
            if ward_id != user.ward_id:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User can only access own ward scope")
        elif user.city_id:
            if city_id != user.city_id:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User can only access own city scope")
        else:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User must be mapped to city/ward scope")
        return

    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient role permissions")


def apply_scope_filters(user: User, role_codes: set[str], city_id, ward_id):
    if is_super_admin(user, role_codes):
        return city_id, ward_id

    if "CITY_ADMIN" in role_codes and user.city_id:
        return user.city_id, ward_id

    if user.ward_id and has_any_role(role_codes, {"WARD_OFFICER", "SANITATION_SUPERVISOR", "PROCESSOR", "AUDITOR"}):
        return user.city_id, user.ward_id

    if user.city_id and has_any_role(role_codes, {"SANITATION_SUPERVISOR", "PROCESSOR", "AUDITOR"}):
        return user.city_id, ward_id

    return city_id, ward_id
