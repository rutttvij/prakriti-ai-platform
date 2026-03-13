from app.api.routes.addresses import router as addresses_router
from app.api.routes.auth import router as auth_router
from app.api.routes.bulk_generators import router as bulk_generators_router
from app.api.routes.cities import router as cities_router
from app.api.routes.health import router as health_router
from app.api.routes.households import router as households_router
from app.api.routes.organizations import router as organizations_router
from app.api.routes.qr_tags import router as qr_tags_router
from app.api.routes.users import router as users_router
from app.api.routes.wards import router as wards_router
from app.api.routes.zones import router as zones_router

__all__ = [
    "addresses_router",
    "auth_router",
    "bulk_generators_router",
    "health_router",
    "households_router",
    "organizations_router",
    "qr_tags_router",
    "cities_router",
    "wards_router",
    "zones_router",
    "users_router",
]
