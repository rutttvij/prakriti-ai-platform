from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.routes.carbon_scope_common import apply_scope_filters, enforce_city_ward_scope
from app.core.dependencies import get_user_role_codes, require_roles
from app.db.session import get_db
from app.models.enums import CarbonProjectStatus, CarbonProjectType
from app.models.user import User
from app.schemas.carbon_project import CarbonProjectCreate, CarbonProjectListItem, CarbonProjectRead
from app.services.carbon_project_service import create_carbon_project, get_carbon_project, list_carbon_projects

router = APIRouter(prefix="/carbon-projects", tags=["carbon-projects"])


@router.post("", response_model=CarbonProjectRead)
def create_carbon_project_endpoint(
    payload: CarbonProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SUPER_ADMIN", "CITY_ADMIN")),
) -> CarbonProjectRead:
    role_codes = get_user_role_codes(current_user)
    enforce_city_ward_scope(current_user, role_codes, payload.city_id, payload.ward_id)
    return create_carbon_project(db, payload, current_user.id)


@router.get("", response_model=list[CarbonProjectListItem])
def list_carbon_projects_endpoint(
    city_id: UUID | None = None,
    ward_id: UUID | None = None,
    project_type: CarbonProjectType | None = None,
    status: CarbonProjectStatus | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "AUDITOR", "PROCESSOR")),
) -> list[CarbonProjectListItem]:
    role_codes = get_user_role_codes(current_user)
    city_id, ward_id = apply_scope_filters(current_user, role_codes, city_id, ward_id)
    return list_carbon_projects(db, city_id=city_id, ward_id=ward_id, project_type=project_type, status=status)


@router.get("/{project_id}", response_model=CarbonProjectRead)
def get_carbon_project_endpoint(
    project_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER", "AUDITOR", "PROCESSOR")),
) -> CarbonProjectRead:
    role_codes = get_user_role_codes(current_user)
    project = get_carbon_project(db, project_id)
    enforce_city_ward_scope(current_user, role_codes, project.city_id, project.ward_id)
    return project
