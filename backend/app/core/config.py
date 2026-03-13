import os
from functools import lru_cache

from dotenv import load_dotenv
from pydantic import BaseModel, Field


load_dotenv()


class Settings(BaseModel):
    database_url: str = Field(alias="DATABASE_URL")
    secret_key: str = Field(alias="SECRET_KEY")
    access_token_expire_minutes: int = Field(default=60, alias="ACCESS_TOKEN_EXPIRE_MINUTES")
    environment: str = Field(default="development", alias="ENVIRONMENT")
    project_name: str = Field(default="Prakriti.AI", alias="PROJECT_NAME")


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    raw_values = {
        "DATABASE_URL": os.getenv("DATABASE_URL"),
        "SECRET_KEY": os.getenv("SECRET_KEY"),
        "ACCESS_TOKEN_EXPIRE_MINUTES": os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"),
        "ENVIRONMENT": os.getenv("ENVIRONMENT", "development"),
        "PROJECT_NAME": os.getenv("PROJECT_NAME", "Prakriti.AI"),
    }
    return Settings.model_validate(raw_values)
