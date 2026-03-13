from __future__ import annotations

from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.routes.report_scope_common import enforce_report_scope, resolve_city_scope
from app.core.dependencies import get_user_role_codes, require_roles
from app.db.session import get_db
from app.models.user import User
from app.schemas.reporting import CityOverviewResponse, CityWardComparisonResponse, WardOverviewResponse
from app.services.reporting_service import (
    get_city_dashboard_overview,
    get_city_ward_comparison,
    get_ward_dashboard_overview,
)

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/city-overview", response_model=CityOverviewResponse)
def get_city_overview_endpoint(
    city_id: UUID | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "SANITATION_SUPERVISOR", "AUDITOR")
    ),
) -> CityOverviewResponse:
    role_codes = get_user_role_codes(current_user)
    city_id, _ = resolve_city_scope(current_user, role_codes, city_id=city_id)
    return get_city_dashboard_overview(db, city_id=city_id, date_from=date_from, date_to=date_to)


@router.get("/ward-overview", response_model=WardOverviewResponse)
def get_ward_overview_endpoint(
    city_id: UUID | None = None,
    ward_id: UUID | None = None,
    zone_id: UUID | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "SANITATION_SUPERVISOR", "AUDITOR")
    ),
) -> WardOverviewResponse:
    role_codes = get_user_role_codes(current_user)
    city_id, ward_scope = resolve_city_scope(current_user, role_codes, city_id=city_id, ward_id=ward_id)
    if ward_id is None:
        ward_id = ward_scope
    if ward_id is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="ward_id is required")

    enforce_report_scope(current_user, role_codes, city_id, ward_id)
    return get_ward_dashboard_overview(
        db,
        city_id=city_id,
        ward_id=ward_id,
        zone_id=zone_id,
        date_from=date_from,
        date_to=date_to,
    )


@router.get("/city-ward-comparison", response_model=CityWardComparisonResponse)
def get_city_ward_comparison_endpoint(
    city_id: UUID | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "SANITATION_SUPERVISOR", "AUDITOR")
    ),
) -> CityWardComparisonResponse:
    role_codes = get_user_role_codes(current_user)
    city_id, _ = resolve_city_scope(current_user, role_codes, city_id=city_id)
    return get_city_ward_comparison(db, city_id=city_id, date_from=date_from, date_to=date_to)
