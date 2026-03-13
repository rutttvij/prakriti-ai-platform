from __future__ import annotations

from uuid import UUID

from fastapi import HTTPException, status

from app.api.routes.carbon_scope_common import apply_scope_filters, enforce_city_ward_scope
from app.models.user import User


def resolve_city_scope(
    current_user: User,
    role_codes: set[str],
    city_id: UUID | None,
    ward_id: UUID | None = None,
    allow_global: bool = False,
) -> tuple[UUID | None, UUID | None]:
    scoped_city_id, scoped_ward_id = apply_scope_filters(current_user, role_codes, city_id, ward_id)
    if scoped_city_id is None and not allow_global:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="city_id is required for this scope",
        )
    return scoped_city_id, scoped_ward_id


def enforce_report_scope(
    current_user: User,
    role_codes: set[str],
    city_id: UUID,
    ward_id: UUID | None,
) -> None:
    enforce_city_ward_scope(current_user, role_codes, city_id, ward_id)


def ensure_auditor_for_sensitive_reports(role_codes: set[str]) -> None:
    if "SUPER_ADMIN" in role_codes:
        return
    if "AUDITOR" not in role_codes:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only AUDITOR or SUPER_ADMIN can access this report",
        )
