from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.routes.report_scope_common import enforce_report_scope
from app.core.dependencies import get_user_role_codes, require_roles
from app.db.session import get_db
from app.models.user import User
from app.schemas.reporting import (
    BatchLifecycleAuditExport,
    BulkGeneratorLifecycleAuditExport,
    CarbonEventLifecycleAuditExport,
)
from app.services.reporting_service import (
    assemble_batch_lifecycle_export,
    assemble_bulk_generator_lifecycle_export,
    assemble_carbon_event_lifecycle_export,
)

router = APIRouter(prefix="/audit", tags=["audit"])


@router.get("/export/batch/{batch_id}", response_model=BatchLifecycleAuditExport)
def export_batch_lifecycle_endpoint(
    batch_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "SANITATION_SUPERVISOR", "AUDITOR")),
) -> BatchLifecycleAuditExport:
    role_codes = get_user_role_codes(current_user)
    payload = assemble_batch_lifecycle_export(db, batch_id)
    enforce_report_scope(current_user, role_codes, payload.batch.city_id, payload.batch.ward_id)
    return payload


@router.get("/export/bulk-generator/{generator_id}", response_model=BulkGeneratorLifecycleAuditExport)
def export_bulk_generator_lifecycle_endpoint(
    generator_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "SANITATION_SUPERVISOR", "AUDITOR")),
) -> BulkGeneratorLifecycleAuditExport:
    role_codes = get_user_role_codes(current_user)
    payload = assemble_bulk_generator_lifecycle_export(db, generator_id)
    enforce_report_scope(current_user, role_codes, payload.generator.city_id, payload.generator.ward_id)
    return payload


@router.get("/export/carbon-event/{event_id}", response_model=CarbonEventLifecycleAuditExport)
def export_carbon_event_lifecycle_endpoint(
    event_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "SANITATION_SUPERVISOR", "AUDITOR")),
) -> CarbonEventLifecycleAuditExport:
    role_codes = get_user_role_codes(current_user)
    payload = assemble_carbon_event_lifecycle_export(db, event_id)

    city_id = None
    ward_id = None
    if payload.batch:
        city_id, ward_id = payload.batch.city_id, payload.batch.ward_id
    elif payload.facility:
        city_id, ward_id = payload.facility.city_id, payload.facility.ward_id

    if city_id is None and not ("SUPER_ADMIN" in role_codes or current_user.is_superuser):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unable to derive scoped access for this carbon event",
        )

    if city_id is not None:
        enforce_report_scope(current_user, role_codes, city_id, ward_id)

    return payload
