from __future__ import annotations

from datetime import date
from enum import Enum
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.routes.report_scope_common import (
    enforce_report_scope,
    resolve_city_scope,
)
from app.core.dependencies import get_user_role_codes, require_roles
from app.db.session import get_db
from app.models.enums import (
    ComplianceStatus,
    EmploymentStatus,
    LedgerEntryType,
    PickupStatus,
    SummaryStatus,
    TransferStatus,
    VerificationStatus,
)
from app.models.user import User
from app.schemas.reporting import (
    BulkGeneratorComplianceSummaryResponse,
    BulkGeneratorProfileReportResponse,
    BulkGeneratorReportPage,
    CarbonLedgerReportPage,
    EnvironmentalSummaryReportPage,
    FacilityReportPage,
    PickupReportPage,
    RouteReportPage,
    TransferReportPage,
    WorkerReportPage,
)
from app.services.reporting_service import (
    build_bulk_generator_compliance_summary,
    get_bulk_generator_profile_report,
    processor_can_access_generator,
    query_bulk_generator_report,
    query_carbon_ledger_report,
    query_environmental_summary_report,
    query_facility_report,
    query_pickup_report,
    query_route_report,
    query_transfer_report,
    query_worker_report,
)

router = APIRouter(prefix="/reports", tags=["reports"])


def _parse_enum(value: str | None, enum_cls: type[Enum], field_name: str):
    if value is None:
        return None
    try:
        return enum_cls(value)
    except ValueError:
        allowed = ", ".join([member.value for member in enum_cls])
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid {field_name}. Allowed values: {allowed}",
        )


@router.get("/pickups", response_model=PickupReportPage)
def get_pickups_report_endpoint(
    city_id: UUID | None = None,
    ward_id: UUID | None = None,
    zone_id: UUID | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    status: str | None = None,
    worker_id: UUID | None = None,
    route_id: UUID | None = None,
    generator_id: UUID | None = None,
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "SANITATION_SUPERVISOR", "AUDITOR")
    ),
) -> PickupReportPage:
    role_codes = get_user_role_codes(current_user)
    city_id, ward_id = resolve_city_scope(
        current_user,
        role_codes,
        city_id=city_id,
        ward_id=ward_id,
        allow_global=True,
    )
    pickup_status = _parse_enum(status, PickupStatus, "status")
    return query_pickup_report(
        db,
        city_id=city_id,
        ward_id=ward_id,
        zone_id=zone_id,
        date_from=date_from,
        date_to=date_to,
        status=pickup_status,
        worker_id=worker_id,
        route_id=route_id,
        generator_id=generator_id,
        limit=limit,
        offset=offset,
    )


@router.get("/workers", response_model=WorkerReportPage)
def get_workers_report_endpoint(
    city_id: UUID | None = None,
    ward_id: UUID | None = None,
    zone_id: UUID | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    status: str | None = None,
    worker_id: UUID | None = None,
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "SANITATION_SUPERVISOR", "AUDITOR")
    ),
) -> WorkerReportPage:
    role_codes = get_user_role_codes(current_user)
    city_id, ward_id = resolve_city_scope(
        current_user,
        role_codes,
        city_id=city_id,
        ward_id=ward_id,
        allow_global=True,
    )
    employment_status = _parse_enum(status, EmploymentStatus, "status")
    return query_worker_report(
        db,
        city_id=city_id,
        ward_id=ward_id,
        zone_id=zone_id,
        date_from=date_from,
        date_to=date_to,
        status=employment_status,
        worker_id=worker_id,
        limit=limit,
        offset=offset,
    )


@router.get("/routes", response_model=RouteReportPage)
def get_routes_report_endpoint(
    city_id: UUID | None = None,
    ward_id: UUID | None = None,
    zone_id: UUID | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    route_id: UUID | None = None,
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "SANITATION_SUPERVISOR", "AUDITOR")
    ),
) -> RouteReportPage:
    role_codes = get_user_role_codes(current_user)
    city_id, ward_id = resolve_city_scope(
        current_user,
        role_codes,
        city_id=city_id,
        ward_id=ward_id,
        allow_global=True,
    )
    return query_route_report(
        db,
        city_id=city_id,
        ward_id=ward_id,
        zone_id=zone_id,
        date_from=date_from,
        date_to=date_to,
        route_id=route_id,
        limit=limit,
        offset=offset,
    )


@router.get("/facilities", response_model=FacilityReportPage)
def get_facilities_report_endpoint(
    city_id: UUID | None = None,
    ward_id: UUID | None = None,
    zone_id: UUID | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    status: bool | None = None,
    facility_id: UUID | None = None,
    verification_status: VerificationStatus | None = None,
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "SUPER_ADMIN",
            "CITY_ADMIN",
            "WARD_OFFICER",
            "SANITATION_SUPERVISOR",
            "AUDITOR",
            "PROCESSOR",
        )
    ),
) -> FacilityReportPage:
    role_codes = get_user_role_codes(current_user)
    city_id, ward_id = resolve_city_scope(
        current_user,
        role_codes,
        city_id=city_id,
        ward_id=ward_id,
        allow_global=True,
    )
    return query_facility_report(
        db,
        city_id=city_id,
        ward_id=ward_id,
        zone_id=zone_id,
        date_from=date_from,
        date_to=date_to,
        facility_id=facility_id,
        status=status,
        verification_status=verification_status,
        limit=limit,
        offset=offset,
    )


@router.get("/transfers", response_model=TransferReportPage)
def get_transfers_report_endpoint(
    city_id: UUID | None = None,
    ward_id: UUID | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    status: str | None = None,
    route_id: UUID | None = None,
    facility_id: UUID | None = None,
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "SUPER_ADMIN",
            "CITY_ADMIN",
            "WARD_OFFICER",
            "SANITATION_SUPERVISOR",
            "AUDITOR",
            "PROCESSOR",
        )
    ),
) -> TransferReportPage:
    role_codes = get_user_role_codes(current_user)
    city_id, ward_id = resolve_city_scope(
        current_user,
        role_codes,
        city_id=city_id,
        ward_id=ward_id,
        allow_global=True,
    )
    transfer_status = _parse_enum(status, TransferStatus, "status")
    return query_transfer_report(
        db,
        city_id=city_id,
        ward_id=ward_id,
        date_from=date_from,
        date_to=date_to,
        status=transfer_status,
        route_id=route_id,
        facility_id=facility_id,
        limit=limit,
        offset=offset,
    )


@router.get("/bulk-generators", response_model=BulkGeneratorReportPage)
def get_bulk_generators_report_endpoint(
    city_id: UUID | None = None,
    ward_id: UUID | None = None,
    zone_id: UUID | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    status: str | None = None,
    generator_id: UUID | None = None,
    verification_status: VerificationStatus | None = None,
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "AUDITOR")),
) -> BulkGeneratorReportPage:
    role_codes = get_user_role_codes(current_user)
    city_id, ward_id = resolve_city_scope(
        current_user,
        role_codes,
        city_id=city_id,
        ward_id=ward_id,
        allow_global=True,
    )
    compliance_status = _parse_enum(status, ComplianceStatus, "status")
    return query_bulk_generator_report(
        db,
        city_id=city_id,
        ward_id=ward_id,
        zone_id=zone_id,
        date_from=date_from,
        date_to=date_to,
        status=compliance_status,
        generator_id=generator_id,
        verification_status=verification_status,
        limit=limit,
        offset=offset,
    )


@router.get("/environmental-summary", response_model=EnvironmentalSummaryReportPage)
def get_environmental_summary_report_endpoint(
    city_id: UUID | None = None,
    ward_id: UUID | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    status: str | None = None,
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "AUDITOR", "PROCESSOR")
    ),
) -> EnvironmentalSummaryReportPage:
    role_codes = get_user_role_codes(current_user)
    city_id, ward_id = resolve_city_scope(
        current_user,
        role_codes,
        city_id=city_id,
        ward_id=ward_id,
        allow_global=True,
    )
    summary_status = _parse_enum(status, SummaryStatus, "status")
    return query_environmental_summary_report(
        db,
        city_id=city_id,
        ward_id=ward_id,
        date_from=date_from,
        date_to=date_to,
        status=summary_status,
        limit=limit,
        offset=offset,
    )


@router.get("/carbon-ledger", response_model=CarbonLedgerReportPage)
def get_carbon_ledger_report_endpoint(
    city_id: UUID | None = None,
    ward_id: UUID | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    status: str | None = None,
    facility_id: UUID | None = None,
    generator_id: UUID | None = None,
    verification_status: VerificationStatus | None = None,
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "AUDITOR", "PROCESSOR")
    ),
) -> CarbonLedgerReportPage:
    role_codes = get_user_role_codes(current_user)
    city_id, ward_id = resolve_city_scope(
        current_user,
        role_codes,
        city_id=city_id,
        ward_id=ward_id,
        allow_global=True,
    )
    entry_type = _parse_enum(status, LedgerEntryType, "status")
    return query_carbon_ledger_report(
        db,
        city_id=city_id,
        ward_id=ward_id,
        date_from=date_from,
        date_to=date_to,
        status=entry_type,
        facility_id=facility_id,
        generator_id=generator_id,
        verification_status=verification_status,
        limit=limit,
        offset=offset,
    )


@router.get("/bulk-generators/{generator_id}", response_model=BulkGeneratorProfileReportResponse)
def get_bulk_generator_profile_report_endpoint(
    generator_id: UUID,
    date_from: date | None = None,
    date_to: date | None = None,
    verification_status: VerificationStatus | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "AUDITOR", "PROCESSOR")),
) -> BulkGeneratorProfileReportResponse:
    role_codes = get_user_role_codes(current_user)
    report = get_bulk_generator_profile_report(
        db,
        generator_id,
        date_from=date_from,
        date_to=date_to,
        verification_status=verification_status,
    )
    enforce_report_scope(current_user, role_codes, report.profile.city_id, report.profile.ward_id)

    if "PROCESSOR" in role_codes and "SUPER_ADMIN" not in role_codes and not current_user.is_superuser:
        if not processor_can_access_generator(db, current_user, generator_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="PROCESSOR can only access generator summaries linked to own facility scope",
            )

    return report


@router.get("/bulk-generators/{generator_id}/compliance-summary", response_model=BulkGeneratorComplianceSummaryResponse)
def get_bulk_generator_compliance_summary_endpoint(
    generator_id: UUID,
    date_from: date | None = None,
    date_to: date | None = None,
    verification_status: VerificationStatus | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "AUDITOR", "PROCESSOR")),
) -> BulkGeneratorComplianceSummaryResponse:
    role_codes = get_user_role_codes(current_user)
    report = build_bulk_generator_compliance_summary(
        db,
        generator_id,
        date_from=date_from,
        date_to=date_to,
        verification_status=verification_status,
    )
    enforce_report_scope(current_user, role_codes, report.profile.city_id, report.profile.ward_id)

    if "PROCESSOR" in role_codes and "SUPER_ADMIN" not in role_codes and not current_user.is_superuser:
        if not processor_can_access_generator(db, current_user, generator_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="PROCESSOR can only access certificate-linked generator compliance summaries",
            )

    return report
