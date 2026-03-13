from fastapi import HTTPException, status

from app.models.user import User


def is_super_admin(user: User, role_codes: set[str]) -> bool:
    return user.is_superuser or "SUPER_ADMIN" in role_codes


def enforce_city_ward_scope(user: User, role_codes: set[str], city_id, ward_id) -> None:
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

    if "AUDITOR" in role_codes:
        if user.ward_id and ward_id != user.ward_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="AUDITOR can only access own ward scope")
        if not user.ward_id and user.city_id and city_id != user.city_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="AUDITOR can only access own city scope")
        return

    if "PROCESSOR" in role_codes:
        # PROCESSOR is facility-linked. City/ward checks are only secondary.
        if user.ward_id and ward_id != user.ward_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="PROCESSOR can only access own ward scope")
        if not user.ward_id and user.city_id and city_id != user.city_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="PROCESSOR can only access own city scope")
        return

    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient role permissions")


def apply_scope_filters(user: User, role_codes: set[str], city_id, ward_id):
    if is_super_admin(user, role_codes):
        return city_id, ward_id

    if "CITY_ADMIN" in role_codes and user.city_id:
        return user.city_id, ward_id

    if ("WARD_OFFICER" in role_codes or "AUDITOR" in role_codes or "PROCESSOR" in role_codes) and user.ward_id:
        return user.city_id, user.ward_id

    if ("AUDITOR" in role_codes or "PROCESSOR" in role_codes) and user.city_id:
        return user.city_id, ward_id

    return city_id, ward_id


def enforce_processor_facility_scope(user: User, role_codes: set[str], facility_id, facility_city_id, facility_ward_id) -> None:
    if "PROCESSOR" not in role_codes or is_super_admin(user, role_codes):
        return

    if facility_id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="PROCESSOR access requires records tied to a facility",
        )

    if user.ward_id and facility_ward_id != user.ward_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="PROCESSOR can only access own ward facilities")

    if not user.ward_id and user.city_id and facility_city_id != user.city_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="PROCESSOR can only access own city facilities")
