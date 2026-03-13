from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import AssignedEntityType, QRTagType


class QRTagCreate(BaseModel):
    code: str = Field(min_length=4, max_length=120)
    tag_type: QRTagType
    is_active: bool = True


class QRTagAssignRequest(BaseModel):
    entity_type: AssignedEntityType
    entity_id: UUID


class QRTagRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    code: str
    tag_type: QRTagType
    assigned_entity_type: AssignedEntityType | None
    assigned_entity_id: UUID | None
    issued_at: datetime | None
    is_active: bool
    created_at: datetime
    updated_at: datetime
