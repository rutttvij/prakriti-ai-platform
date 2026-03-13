from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.security import verify_password
from app.models.user import User
from app.models.user_role import UserRole


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    user = db.scalar(
        select(User)
        .where(User.email == email)
        .options(selectinload(User.user_roles).selectinload(UserRole.role))
    )
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user
