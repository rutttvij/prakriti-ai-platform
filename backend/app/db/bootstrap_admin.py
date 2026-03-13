import os
import sys

from sqlalchemy import select

from app.core.security import get_password_hash
from app.db.session import SessionLocal
from app.models.city import City
from app.models.organization import Organization
from app.models.user import User
from app.models.user_role import UserRole
from app.models.ward import Ward
from app.models.zone import Zone
from app.services.role_service import assign_role, seed_system_roles

DEFAULT_ORG_NAME = "Prakriti Default Organization"
DEFAULT_ORG_SLUG = "prakriti-default"
DEFAULT_ORG_TYPE = "municipality"

DEFAULT_CITY_NAME = "Default City"
DEFAULT_CITY_STATE = "Default State"
DEFAULT_CITY_COUNTRY = "India"

DEFAULT_WARD_NAME = "Default Ward"
DEFAULT_WARD_CODE = "WARD-001"

DEFAULT_ZONE_NAME = "Default Zone"
DEFAULT_ZONE_CODE = "ZONE-001"


def _require_env(name: str) -> str:
    value = os.getenv(name)
    if value is None or not value.strip():
        raise ValueError(f"Missing required environment variable: {name}")
    return value.strip()


def _ensure_organization(db) -> Organization:
    organization = db.scalar(select(Organization).where(Organization.slug == DEFAULT_ORG_SLUG))
    if organization:
        print(f"Organization already exists: {organization.name} ({organization.id})")
        return organization

    organization = Organization(
        name=DEFAULT_ORG_NAME,
        slug=DEFAULT_ORG_SLUG,
        type=DEFAULT_ORG_TYPE,
        is_active=True,
    )
    db.add(organization)
    db.flush()
    print(f"Created organization: {organization.name} ({organization.id})")
    return organization


def _ensure_city(db, organization_id) -> City:
    city = db.scalar(
        select(City).where(City.organization_id == organization_id, City.name == DEFAULT_CITY_NAME)
    )
    if city:
        print(f"City already exists: {city.name} ({city.id})")
        return city

    city = City(
        organization_id=organization_id,
        name=DEFAULT_CITY_NAME,
        state=DEFAULT_CITY_STATE,
        country=DEFAULT_CITY_COUNTRY,
        is_active=True,
    )
    db.add(city)
    db.flush()
    print(f"Created city: {city.name} ({city.id})")
    return city


def _ensure_ward(db, city_id) -> Ward:
    ward = db.scalar(select(Ward).where(Ward.city_id == city_id, Ward.code == DEFAULT_WARD_CODE))
    if ward:
        print(f"Ward already exists: {ward.name} ({ward.id})")
        return ward

    ward = Ward(city_id=city_id, name=DEFAULT_WARD_NAME, code=DEFAULT_WARD_CODE, is_active=True)
    db.add(ward)
    db.flush()
    print(f"Created ward: {ward.name} ({ward.id})")
    return ward


def _ensure_zone(db, ward_id) -> Zone:
    zone = db.scalar(select(Zone).where(Zone.ward_id == ward_id, Zone.code == DEFAULT_ZONE_CODE))
    if zone:
        print(f"Zone already exists: {zone.name} ({zone.id})")
        return zone

    zone = Zone(ward_id=ward_id, name=DEFAULT_ZONE_NAME, code=DEFAULT_ZONE_CODE, is_active=True)
    db.add(zone)
    db.flush()
    print(f"Created zone: {zone.name} ({zone.id})")
    return zone


def _ensure_super_admin(db, name: str, email: str, password: str, organization_id, city_id, ward_id, zone_id) -> User:
    user = db.scalar(select(User).where(User.email == email))
    if user:
        print(f"Admin user already exists: {user.email} ({user.id})")
    else:
        user = User(
            organization_id=organization_id,
            city_id=city_id,
            ward_id=ward_id,
            zone_id=zone_id,
            full_name=name,
            email=email,
            hashed_password=get_password_hash(password),
            is_superuser=True,
            is_active=True,
            is_verified=True,
        )
        db.add(user)
        db.flush()
        print(f"Created admin user: {user.email} ({user.id})")

    # Ensure elevated flags remain true for bootstrap admin.
    updates = []
    if not user.is_superuser:
        user.is_superuser = True
        updates.append("is_superuser=True")
    if not user.is_active:
        user.is_active = True
        updates.append("is_active=True")
    if not user.is_verified:
        user.is_verified = True
        updates.append("is_verified=True")
    if updates:
        print(f"Updated admin user flags: {', '.join(updates)}")

    existing_mapping = db.scalar(
        select(UserRole).join(UserRole.role).where(UserRole.user_id == user.id, UserRole.role.has(code="SUPER_ADMIN"))
    )
    assign_role(db, user, "SUPER_ADMIN")
    if existing_mapping:
        print("SUPER_ADMIN role already assigned to admin user")
    else:
        print("Assigned SUPER_ADMIN role to admin user")

    return user


def run_bootstrap() -> None:
    name = _require_env("BOOTSTRAP_ADMIN_NAME")
    email = _require_env("BOOTSTRAP_ADMIN_EMAIL").lower()
    password = _require_env("BOOTSTRAP_ADMIN_PASSWORD")

    with SessionLocal() as db:
        try:
            seed_system_roles(db)
            print("System roles ensured")

            organization = _ensure_organization(db)
            city = _ensure_city(db, organization.id)
            ward = _ensure_ward(db, city.id)
            zone = _ensure_zone(db, ward.id)

            _ensure_super_admin(
                db=db,
                name=name,
                email=email,
                password=password,
                organization_id=organization.id,
                city_id=city.id,
                ward_id=ward.id,
                zone_id=zone.id,
            )

            db.commit()
            print("Bootstrap admin setup completed successfully")
        except Exception as exc:
            db.rollback()
            print(f"Bootstrap admin setup failed: {exc}", file=sys.stderr)
            raise


if __name__ == "__main__":
    run_bootstrap()
