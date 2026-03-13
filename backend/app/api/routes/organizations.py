from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_active_user, require_roles
from app.db.session import get_db
from app.models.user import User
from app.schemas.organization import OrganizationCreate, OrganizationRead
from app.services.organization_service import create_organization, list_organizations

router = APIRouter(prefix="/organizations", tags=["organizations"])


@router.post("", response_model=OrganizationRead)
def create_organization_endpoint(
    payload: OrganizationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SUPER_ADMIN")),
) -> OrganizationRead:
    return create_organization(db, payload, current_user.id)


@router.get("", response_model=list[OrganizationRead])
def list_organizations_endpoint(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("SUPER_ADMIN")),
) -> list[OrganizationRead]:
    return list_organizations(db)
