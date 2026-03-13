from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import Select, select
from sqlalchemy.orm import Session, selectinload

from app.core.security import get_password_hash
from app.models.city import City
from app.models.organization import Organization
from app.models.role import Role
from app.models.user import User
from app.models.user_role import UserRole
from app.models.ward import Ward
from app.models.zone import Zone
from app.schemas.role import RoleRead
from app.schemas.user import UserCreate, UserRead
from app.services.role_service import assign_role


def _validate_user_hierarchy(db: Session, payload: UserCreate) -> tuple[Organization | None, City | None, Ward | None, Zone | None]:
    organization = db.get(Organization, payload.organization_id) if payload.organization_id else None
    city = db.get(City, payload.city_id) if payload.city_id else None
    ward = db.get(Ward, payload.ward_id) if payload.ward_id else None
    zone = db.get(Zone, payload.zone_id) if payload.zone_id else None

    if payload.organization_id and not organization:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")
    if payload.city_id and not city:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="City not found")
    if payload.ward_id and not ward:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ward not found")
    if payload.zone_id and not zone:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Zone not found")

    if city and organization and city.organization_id != organization.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="City does not belong to organization")
    if ward and city and ward.city_id != city.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ward does not belong to city")
    if zone and ward and zone.ward_id != ward.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Zone does not belong to ward")

    return organization, city, ward, zone


def create_user(db: Session, payload: UserCreate, actor_id: UUID | None = None) -> User:
    existing = db.scalar(select(User).where(User.email == payload.email))
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    _validate_user_hierarchy(db, payload)

    user = User(
        organization_id=payload.organization_id,
        city_id=payload.city_id,
        ward_id=payload.ward_id,
        zone_id=payload.zone_id,
        full_name=payload.full_name,
        email=payload.email,
        phone=payload.phone,
        hashed_password=get_password_hash(payload.password),
        is_superuser=payload.is_superuser,
        is_active=payload.is_active,
        is_verified=payload.is_verified,
    )
    if actor_id:
        user.created_by = actor_id
        user.updated_by = actor_id

    db.add(user)
    db.flush()

    for role_code in payload.role_codes:
        try:
            assign_role(db, user, role_code, actor_id)
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    db.commit()
    db.refresh(user)
    return db.scalar(
        select(User)
        .where(User.id == user.id)
        .options(selectinload(User.user_roles).selectinload(UserRole.role))
    )


def list_users(db: Session, city_id: UUID | None = None, ward_id: UUID | None = None) -> list[User]:
    query: Select[tuple[User]] = select(User).options(
        selectinload(User.user_roles).selectinload(UserRole.role)
    )
    if city_id:
        query = query.where(User.city_id == city_id)
    if ward_id:
        query = query.where(User.ward_id == ward_id)
    query = query.order_by(User.created_at.desc())
    return list(db.scalars(query).all())


def to_user_read(user: User) -> UserRead:
    roles = [
        RoleRead.model_validate(ur.role)
        for ur in user.user_roles
        if ur.role and ur.role.is_active
    ]
    return UserRead(
        id=user.id,
        organization_id=user.organization_id,
        city_id=user.city_id,
        ward_id=user.ward_id,
        zone_id=user.zone_id,
        full_name=user.full_name,
        email=user.email,
        phone=user.phone,
        is_superuser=user.is_superuser,
        is_active=user.is_active,
        is_verified=user.is_verified,
        created_at=user.created_at,
        updated_at=user.updated_at,
        roles=roles,
    )
