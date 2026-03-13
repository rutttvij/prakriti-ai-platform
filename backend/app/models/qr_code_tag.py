from datetime import datetime
from uuid import UUID

from sqlalchemy import Enum as SQLEnum
from sqlalchemy import Index, String
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.mixins import ActiveMixin, AuditMixin, Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import AssignedEntityType, QRTagType


class QRCodeTag(UUIDPrimaryKeyMixin, TimestampMixin, AuditMixin, ActiveMixin, Base):
    __tablename__ = "qr_code_tags"
    __table_args__ = (
        Index("ix_qr_code_tags_code", "code", unique=True),
        Index("ix_qr_code_tags_assigned_entity", "assigned_entity_type", "assigned_entity_id"),
    )

    code: Mapped[str] = mapped_column(String(120), nullable=False)
    tag_type: Mapped[QRTagType] = mapped_column(SQLEnum(QRTagType, name="qr_tag_type", native_enum=False), nullable=False)
    assigned_entity_type: Mapped[AssignedEntityType | None] = mapped_column(
        SQLEnum(AssignedEntityType, name="assigned_entity_type", native_enum=False), nullable=True
    )
    assigned_entity_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), nullable=True)
    issued_at: Mapped[datetime | None] = mapped_column(nullable=True)

    household = relationship("Household", back_populates="qr_tag", uselist=False)
    bulk_generator = relationship("BulkWasteGenerator", back_populates="qr_tag", uselist=False)
