from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class RoleRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    code: str
    description: str | None = None
    is_system_role: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime
