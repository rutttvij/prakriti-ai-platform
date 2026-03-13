from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.routes.source_registry_common import enforce_city_ward_scope_for_entity
from app.core.dependencies import get_user_role_codes, require_roles
from app.db.session import get_db
from app.models.user import User
from app.schemas.qr_tag import QRTagAssignRequest, QRTagCreate, QRTagRead
from app.services.qr_tag_service import assign_qr_tag, create_qr_tag, get_assignable_entity, list_qr_tags

router = APIRouter(prefix="/qr-tags", tags=["qr-tags"])


@router.post("", response_model=QRTagRead)
def create_qr_tag_endpoint(
    payload: QRTagCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER")),
) -> QRTagRead:
    return create_qr_tag(db, payload, current_user.id)


@router.get("", response_model=list[QRTagRead])
def list_qr_tags_endpoint(
    is_active: bool | None = None,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER")),
) -> list[QRTagRead]:
    return list_qr_tags(db, is_active=is_active)


@router.post("/{tag_id}/assign", response_model=QRTagRead)
def assign_qr_tag_endpoint(
    tag_id: UUID,
    payload: QRTagAssignRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER")),
) -> QRTagRead:
    role_codes = get_user_role_codes(current_user)
    entity = get_assignable_entity(db, payload.entity_type, payload.entity_id)
    enforce_city_ward_scope_for_entity(current_user, role_codes, entity.city_id, entity.ward_id)

    return assign_qr_tag(db, tag_id, payload.entity_type, payload.entity_id, current_user.id)
