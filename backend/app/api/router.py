from fastapi import APIRouter

from app.api.routes.auth import router as auth_router
from app.api.routes.addresses import router as address_router
from app.api.routes.bulk_generators import router as bulk_generator_router
from app.api.routes.cities import router as city_router
from app.api.routes.health import router as health_router
from app.api.routes.households import router as household_router
from app.api.routes.organizations import router as organization_router
from app.api.routes.qr_tags import router as qr_tag_router
from app.api.routes.users import router as user_router
from app.api.routes.wards import router as ward_router
from app.api.routes.zones import router as zone_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(auth_router)
api_router.include_router(organization_router)
api_router.include_router(city_router)
api_router.include_router(ward_router)
api_router.include_router(zone_router)
api_router.include_router(user_router)
api_router.include_router(address_router)
api_router.include_router(qr_tag_router)
api_router.include_router(household_router)
api_router.include_router(bulk_generator_router)
