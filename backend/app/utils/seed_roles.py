import logging

from sqlalchemy import inspect

from app.db.session import SessionLocal, engine
from app.services.role_service import seed_system_roles

logger = logging.getLogger(__name__)


def seed_roles_if_ready() -> None:
    """
    Startup-safe seeding:
    - If migrations have not created the `roles` table yet, skip without crashing.
    - If table exists, seed missing system roles idempotently.
    """
    inspector = inspect(engine)
    if not inspector.has_table("roles"):
        logger.info("Skipping role seed: roles table does not exist yet")
        return

    with SessionLocal() as db:
        seed_system_roles(db)
        logger.info("System roles ensured")
