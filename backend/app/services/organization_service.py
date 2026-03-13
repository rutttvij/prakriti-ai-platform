from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.organization import Organization
from app.schemas.organization import OrganizationCreate


def create_organization(db: Session, payload: OrganizationCreate, actor_id: UUID | None = None) -> Organization:
    existing_slug = db.scalar(select(Organization).where(Organization.slug == payload.slug))
    if existing_slug:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Organization slug already exists",
        )

    organization = Organization(
        name=payload.name,
        slug=payload.slug,
        type=payload.type,
        is_active=payload.is_active,
    )
    if actor_id:
        organization.created_by = actor_id
        organization.updated_by = actor_id

    db.add(organization)
    db.commit()
    db.refresh(organization)
    return organization


def list_organizations(db: Session) -> list[Organization]:
    return list(db.scalars(select(Organization).order_by(Organization.created_at.desc())).all())
