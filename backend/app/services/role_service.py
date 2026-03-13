from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.constants import SYSTEM_ROLE_CODES
from app.models.role import Role
from app.models.user import User
from app.models.user_role import UserRole

SYSTEM_ROLE_DETAILS = {
    "SUPER_ADMIN": ("Super Admin", "Platform-level administrator with full access."),
    "CITY_ADMIN": ("City Admin", "City-level administrator for municipal operations."),
    "WARD_OFFICER": ("Ward Officer", "Ward-level officer for local operations oversight."),
    "SANITATION_SUPERVISOR": ("Sanitation Supervisor", "Supervises sanitation workforce and operations."),
    "WORKER": ("Worker", "Field worker executing municipal waste operations."),
    "CITIZEN": ("Citizen", "Citizen stakeholder and reporting participant."),
    "BULK_GENERATOR": ("Bulk Generator", "Entity producing high-volume waste."),
    "PROCESSOR": ("Processor", "Waste processor/operator stakeholder."),
    "AUDITOR": ("Auditor", "Audit and compliance oversight role."),
}


def get_role_by_code(db: Session, code: str) -> Role | None:
    return db.scalar(select(Role).where(Role.code == code))


def assign_role(db: Session, user: User, role_code: str, created_by: UUID | None = None) -> UserRole:
    role = get_role_by_code(db, role_code)
    if role is None or not role.is_active:
        raise ValueError(f"Role '{role_code}' does not exist or is inactive")

    existing = db.scalar(
        select(UserRole).where(UserRole.user_id == user.id, UserRole.role_id == role.id)
    )
    if existing:
        return existing

    user_role = UserRole(user_id=user.id, role_id=role.id)
    if created_by:
        user_role.created_by = created_by
        user_role.updated_by = created_by

    db.add(user_role)
    db.flush()
    return user_role


def seed_system_roles(db: Session) -> None:
    existing_codes = set(db.scalars(select(Role.code).where(Role.code.in_(SYSTEM_ROLE_CODES))).all())

    created = False
    for code in SYSTEM_ROLE_CODES:
        if code in existing_codes:
            continue
        name, description = SYSTEM_ROLE_DETAILS[code]
        db.add(
            Role(
                name=name,
                code=code,
                description=description,
                is_system_role=True,
                is_active=True,
            )
        )
        created = True

    if created:
        db.commit()
