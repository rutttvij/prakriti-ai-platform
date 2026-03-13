from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.routes.processing_scope_common import enforce_scope, has_any_role
from app.core.dependencies import get_current_active_user, get_user_role_codes, require_roles
from app.db.session import get_db
from app.models.enums import VerificationStatus, WasteType
from app.models.user import User
from app.schemas.recovery_certificate import RecoveryCertificateCreate, RecoveryCertificateListItem, RecoveryCertificateRead
from app.services.collected_batch_service import get_collected_batch
from app.services.recovery_certificate_service import create_recovery_certificate, get_recovery_certificate, list_recovery_certificates

router = APIRouter(prefix="/recovery-certificates", tags=["recovery-certificates"])


@router.post("", response_model=RecoveryCertificateRead)
def create_recovery_certificate_endpoint(
    payload: RecoveryCertificateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "PROCESSOR")),
) -> RecoveryCertificateRead:
    role_codes = get_user_role_codes(current_user)
    batch = get_collected_batch(db, payload.batch_id)
    enforce_scope(current_user, role_codes, batch.city_id, batch.ward_id)
    return create_recovery_certificate(db, payload, current_user.id)


@router.get("", response_model=list[RecoveryCertificateListItem])
def list_recovery_certificates_endpoint(
    facility_id: UUID | None = None,
    batch_id: UUID | None = None,
    bulk_generator_id: UUID | None = None,
    waste_type: WasteType | None = None,
    verification_status: VerificationStatus | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> list[RecoveryCertificateListItem]:
    role_codes = get_user_role_codes(current_user)
    if not has_any_role(role_codes, {"SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "SANITATION_SUPERVISOR", "PROCESSOR", "AUDITOR"}) and not current_user.is_superuser:
        return []

    certs = list_recovery_certificates(
        db,
        facility_id=facility_id,
        batch_id=batch_id,
        bulk_generator_id=bulk_generator_id,
        waste_type=waste_type,
        verification_status=verification_status,
    )

    scoped = []
    for cert in certs:
        try:
            enforce_scope(current_user, role_codes, cert.batch.city_id, cert.batch.ward_id)
            scoped.append(cert)
        except HTTPException:
            continue
    return scoped


@router.get("/{certificate_id}", response_model=RecoveryCertificateRead)
def get_recovery_certificate_endpoint(
    certificate_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> RecoveryCertificateRead:
    role_codes = get_user_role_codes(current_user)
    cert = get_recovery_certificate(db, certificate_id)
    enforce_scope(current_user, role_codes, cert.batch.city_id, cert.batch.ward_id)
    return cert
