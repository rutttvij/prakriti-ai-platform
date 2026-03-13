from uuid import UUID

from sqlalchemy import ForeignKey, Index, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.mixins import ActiveMixin, AuditMixin, Base, TimestampMixin, UUIDPrimaryKeyMixin


class Zone(UUIDPrimaryKeyMixin, TimestampMixin, AuditMixin, ActiveMixin, Base):
    __tablename__ = "zones"
    __table_args__ = (
        UniqueConstraint("ward_id", "code", name="uq_zones_ward_code"),
        Index("ix_zones_ward_id", "ward_id"),
        Index("ix_zones_code", "code"),
    )

    ward_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("wards.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    code: Mapped[str] = mapped_column(String(50), nullable=False)

    ward = relationship("Ward", back_populates="zones")
    users = relationship("User", back_populates="zone")
    households = relationship("Household", back_populates="zone")
    bulk_generators = relationship("BulkWasteGenerator", back_populates="zone")
