from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.models.carbon_project import CarbonProject
from app.schemas.carbon_project import CarbonProjectCreate
from app.services.operations_common import validate_city_ward_zone


def create_carbon_project(db: Session, payload: CarbonProjectCreate, actor_id: UUID | None = None) -> CarbonProject:
    existing = db.scalar(select(CarbonProject).where(CarbonProject.project_code == payload.project_code))
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Project code already exists")

    validate_city_ward_zone(db, payload.city_id, payload.ward_id, None)

    if payload.end_date and payload.end_date < payload.start_date:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="end_date cannot be before start_date")

    project = CarbonProject(**payload.model_dump())
    if actor_id:
        project.created_by = actor_id
        project.updated_by = actor_id

    db.add(project)
    db.commit()
    db.refresh(project)
    return project


def list_carbon_projects(db: Session, city_id: UUID | None = None, ward_id: UUID | None = None, project_type=None, status=None) -> list[CarbonProject]:
    query: Select[tuple[CarbonProject]] = select(CarbonProject).order_by(CarbonProject.created_at.desc())
    if city_id:
        query = query.where(CarbonProject.city_id == city_id)
    if ward_id:
        query = query.where(CarbonProject.ward_id == ward_id)
    if project_type:
        query = query.where(CarbonProject.project_type == project_type)
    if status:
        query = query.where(CarbonProject.status == status)
    return list(db.scalars(query).all())


def get_carbon_project(db: Session, project_id: UUID) -> CarbonProject:
    project = db.get(CarbonProject, project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Carbon project not found")
    return project
