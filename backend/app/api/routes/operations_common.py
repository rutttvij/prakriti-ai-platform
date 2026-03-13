from fastapi import HTTPException, status

from app.models.user import User


MANAGER_ROLES = {"SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "SANITATION_SUPERVISOR"}


def is_super_admin(user: User, role_codes: set[str]) -> bool:
    return user.is_superuser or "SUPER_ADMIN" in role_codes


def is_manager(user: User, role_codes: set[str]) -> bool:
    return is_super_admin(user, role_codes) or bool(MANAGER_ROLES.intersection(role_codes))


def is_worker(role_codes: set[str]) -> bool:
    return "WORKER" in role_codes


def enforce_operational_scope(user: User, role_codes: set[str], city_id, ward_id) -> None:
    if is_super_admin(user, role_codes):
        return

    if "CITY_ADMIN" in role_codes:
        if not user.city_id or user.city_id != city_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="CITY_ADMIN can only manage own city")
        return

    if "WARD_OFFICER" in role_codes:
        if not user.ward_id or user.ward_id != ward_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="WARD_OFFICER can only manage own ward")
        return

    if "SANITATION_SUPERVISOR" in role_codes:
        if user.ward_id:
            if ward_id != user.ward_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="SANITATION_SUPERVISOR can only manage own ward scope",
                )
        elif user.city_id:
            if city_id != user.city_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="SANITATION_SUPERVISOR can only manage own city scope",
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="SANITATION_SUPERVISOR user must be mapped to city/ward",
            )
        return

    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient role permissions")


def scope_list_filters(user: User, role_codes: set[str], city_id, ward_id):
    if is_super_admin(user, role_codes):
        return city_id, ward_id

    if "CITY_ADMIN" in role_codes and user.city_id:
        return user.city_id, ward_id

    if ("WARD_OFFICER" in role_codes or "SANITATION_SUPERVISOR" in role_codes) and user.ward_id:
        return user.city_id, user.ward_id

    if "SANITATION_SUPERVISOR" in role_codes and user.city_id:
        return user.city_id, ward_id

    return city_id, ward_id
