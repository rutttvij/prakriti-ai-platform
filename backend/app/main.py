from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.router import api_router
from app.core.config import get_settings
from app.utils.seed_roles import seed_roles_if_ready


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Keep startup idempotent and migration-safe.
    seed_roles_if_ready()
    yield


settings = get_settings()
app = FastAPI(title=settings.project_name, lifespan=lifespan)
app.include_router(api_router)
