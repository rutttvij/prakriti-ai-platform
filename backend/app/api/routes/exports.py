from __future__ import annotations

from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.api.routes.report_scope_common import resolve_city_scope
from app.core.dependencies import get_user_role_codes, require_roles
from app.db.session import get_db
from app.models.enums import ComplianceStatus, LedgerEntryType, PickupStatus, SummaryStatus, VerificationStatus
from app.models.user import User
from app.services.reporting_service import (
    generate_bulk_generators_csv,
    generate_carbon_ledger_csv,
    generate_environmental_summaries_csv,
    generate_pickups_csv,
    query_bulk_generator_report,
    query_carbon_ledger_report,
    query_environmental_summary_report,
    query_pickup_report,
)

router = APIRouter(prefix="/exports", tags=["exports"])


@router.get("/pickups.csv")
def export_pickups_csv_endpoint(
    city_id: UUID | None = None,
    ward_id: UUID | None = None,
    zone_id: UUID | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    status: PickupStatus | None = None,
    worker_id: UUID | None = None,
    route_id: UUID | None = None,
    generator_id: UUID | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "SANITATION_SUPERVISOR", "AUDITOR")
    ),
):
    role_codes = get_user_role_codes(current_user)
    city_id, ward_id = resolve_city_scope(
        current_user,
        role_codes,
        city_id=city_id,
        ward_id=ward_id,
        allow_global=True,
    )
    page = query_pickup_report(
        db,
        city_id=city_id,
        ward_id=ward_id,
        zone_id=zone_id,
        date_from=date_from,
        date_to=date_to,
        status=status,
        worker_id=worker_id,
        route_id=route_id,
        generator_id=generator_id,
        limit=500,
        offset=0,
    )

    all_rows = list(page.rows)
    next_offset = 500
    while len(all_rows) < page.meta.total_count:
        next_page = query_pickup_report(
            db,
            city_id=city_id,
            ward_id=ward_id,
            zone_id=zone_id,
            date_from=date_from,
            date_to=date_to,
            status=status,
            worker_id=worker_id,
            route_id=route_id,
            generator_id=generator_id,
            limit=500,
            offset=next_offset,
        )
        if not next_page.rows:
            break
        all_rows.extend(next_page.rows)
        next_offset += 500

    csv_text = generate_pickups_csv(page.model_copy(update={"rows": all_rows}))
    return StreamingResponse(
        iter([csv_text]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=pickups.csv"},
    )


@router.get("/bulk-generators.csv")
def export_bulk_generators_csv_endpoint(
    city_id: UUID | None = None,
    ward_id: UUID | None = None,
    zone_id: UUID | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    status: ComplianceStatus | None = None,
    generator_id: UUID | None = None,
    verification_status: VerificationStatus | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "AUDITOR")),
):
    role_codes = get_user_role_codes(current_user)
    city_id, ward_id = resolve_city_scope(
        current_user,
        role_codes,
        city_id=city_id,
        ward_id=ward_id,
        allow_global=True,
    )

    page = query_bulk_generator_report(
        db,
        city_id=city_id,
        ward_id=ward_id,
        zone_id=zone_id,
        date_from=date_from,
        date_to=date_to,
        status=status,
        generator_id=generator_id,
        verification_status=verification_status,
        limit=500,
        offset=0,
    )

    all_rows = list(page.rows)
    next_offset = 500
    while len(all_rows) < page.meta.total_count:
        next_page = query_bulk_generator_report(
            db,
            city_id=city_id,
            ward_id=ward_id,
            zone_id=zone_id,
            date_from=date_from,
            date_to=date_to,
            status=status,
            generator_id=generator_id,
            verification_status=verification_status,
            limit=500,
            offset=next_offset,
        )
        if not next_page.rows:
            break
        all_rows.extend(next_page.rows)
        next_offset += 500

    csv_text = generate_bulk_generators_csv(page.model_copy(update={"rows": all_rows}))
    return StreamingResponse(
        iter([csv_text]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=bulk-generators.csv"},
    )


@router.get("/environmental-summaries.csv")
def export_environmental_summaries_csv_endpoint(
    city_id: UUID | None = None,
    ward_id: UUID | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    status: SummaryStatus | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "AUDITOR", "PROCESSOR")),
):
    role_codes = get_user_role_codes(current_user)
    city_id, ward_id = resolve_city_scope(
        current_user,
        role_codes,
        city_id=city_id,
        ward_id=ward_id,
        allow_global=True,
    )

    page = query_environmental_summary_report(
        db,
        city_id=city_id,
        ward_id=ward_id,
        date_from=date_from,
        date_to=date_to,
        status=status,
        limit=500,
        offset=0,
    )

    all_rows = list(page.rows)
    next_offset = 500
    while len(all_rows) < page.meta.total_count:
        next_page = query_environmental_summary_report(
            db,
            city_id=city_id,
            ward_id=ward_id,
            date_from=date_from,
            date_to=date_to,
            status=status,
            limit=500,
            offset=next_offset,
        )
        if not next_page.rows:
            break
        all_rows.extend(next_page.rows)
        next_offset += 500

    csv_text = generate_environmental_summaries_csv(page.model_copy(update={"rows": all_rows}))
    return StreamingResponse(
        iter([csv_text]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=environmental-summaries.csv"},
    )


@router.get("/carbon-ledger.csv")
def export_carbon_ledger_csv_endpoint(
    city_id: UUID | None = None,
    ward_id: UUID | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    status: LedgerEntryType | None = None,
    facility_id: UUID | None = None,
    generator_id: UUID | None = None,
    verification_status: VerificationStatus | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "AUDITOR", "PROCESSOR")),
):
    role_codes = get_user_role_codes(current_user)
    city_id, ward_id = resolve_city_scope(
        current_user,
        role_codes,
        city_id=city_id,
        ward_id=ward_id,
        allow_global=True,
    )

    page = query_carbon_ledger_report(
        db,
        city_id=city_id,
        ward_id=ward_id,
        date_from=date_from,
        date_to=date_to,
        status=status,
        facility_id=facility_id,
        generator_id=generator_id,
        verification_status=verification_status,
        limit=500,
        offset=0,
    )

    all_rows = list(page.rows)
    next_offset = 500
    while len(all_rows) < page.meta.total_count:
        next_page = query_carbon_ledger_report(
            db,
            city_id=city_id,
            ward_id=ward_id,
            date_from=date_from,
            date_to=date_to,
            status=status,
            facility_id=facility_id,
            generator_id=generator_id,
            verification_status=verification_status,
            limit=500,
            offset=next_offset,
        )
        if not next_page.rows:
            break
        all_rows.extend(next_page.rows)
        next_offset += 500

    csv_text = generate_carbon_ledger_csv(page.model_copy(update={"rows": all_rows}))
    return StreamingResponse(
        iter([csv_text]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=carbon-ledger.csv"},
    )
