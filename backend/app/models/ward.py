from uuid import UUID

from sqlalchemy import ForeignKey, Index, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.mixins import ActiveMixin, AuditMixin, Base, TimestampMixin, UUIDPrimaryKeyMixin


class Ward(UUIDPrimaryKeyMixin, TimestampMixin, AuditMixin, ActiveMixin, Base):
    __tablename__ = "wards"
    __table_args__ = (
        UniqueConstraint("city_id", "code", name="uq_wards_city_code"),
        Index("ix_wards_city_id", "city_id"),
        Index("ix_wards_code", "code"),
    )

    city_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("cities.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    code: Mapped[str] = mapped_column(String(50), nullable=False)

    city = relationship("City", back_populates="wards")
    zones = relationship("Zone", back_populates="ward", cascade="all, delete-orphan")
    users = relationship("User", back_populates="ward")
    households = relationship("Household", back_populates="ward")
    bulk_generators = relationship("BulkWasteGenerator", back_populates="ward")
