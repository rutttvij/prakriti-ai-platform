from app.db.mixins import Base
from app.models import (
    address,
    bulk_waste_generator,
    city,
    household,
    organization,
    qr_code_tag,
    role,
    user,
    user_role,
    ward,
    zone,
)

__all__ = ["Base"]
