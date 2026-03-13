from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.routes.carbon_scope_common import apply_scope_filters, enforce_city_ward_scope
from app.core.dependencies import get_user_role_codes, require_roles
from app.db.session import get_db
from app.models.enums import SummaryStatus
from app.models.user import User
from app.schemas.environmental_summary import (
    EnvironmentalSummaryGenerateRequest,
    EnvironmentalSummaryListItem,
    EnvironmentalSummaryRead,
)
from app.services.environmental_summary_service import (
    generate_environmental_summary,
    get_environmental_summary,
    list_environmental_summaries,
)

router = APIRouter(prefix="/environmental-summaries", tags=["environmental-summaries"])


@router.post("/generate", response_model=EnvironmentalSummaryRead)
def generate_environmental_summary_endpoint(
    payload: EnvironmentalSummaryGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "AUDITOR")),
) -> EnvironmentalSummaryRead:
    role_codes = get_user_role_codes(current_user)
    enforce_city_ward_scope(current_user, role_codes, payload.city_id, payload.ward_id)
    return generate_environmental_summary(db, payload, current_user.id)


@router.get("", response_model=list[EnvironmentalSummaryListItem])
def list_environmental_summaries_endpoint(
    city_id: UUID | None = None,
    ward_id: UUID | None = None,
    reporting_month: int | None = None,
    reporting_year: int | None = None,
    summary_status: SummaryStatus | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "AUDITOR", "PROCESSOR")),
) -> list[EnvironmentalSummaryListItem]:
    role_codes = get_user_role_codes(current_user)
    city_id, ward_id = apply_scope_filters(current_user, role_codes, city_id, ward_id)
    return list_environmental_summaries(
        db,
        city_id=city_id,
        ward_id=ward_id,
        reporting_month=reporting_month,
        reporting_year=reporting_year,
        summary_status=summary_status,
    )


@router.get("/{summary_id}", response_model=EnvironmentalSummaryRead)
def get_environmental_summary_endpoint(
    summary_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "AUDITOR", "PROCESSOR")),
) -> EnvironmentalSummaryRead:
    role_codes = get_user_role_codes(current_user)
    summary = get_environmental_summary(db, summary_id)
    enforce_city_ward_scope(current_user, role_codes, summary.city_id, summary.ward_id)
    return summary
