from datetime import date, time
from uuid import UUID

from sqlalchemy import ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.mixins import ActiveMixin, AuditMixin, Base, TimestampMixin, UUIDPrimaryKeyMixin


class Shift(UUIDPrimaryKeyMixin, TimestampMixin, AuditMixin, ActiveMixin, Base):
    __tablename__ = "shifts"
    __table_args__ = (
        Index("ix_shifts_city_id", "city_id"),
        Index("ix_shifts_ward_id", "ward_id"),
        Index("ix_shifts_zone_id", "zone_id"),
        Index("ix_shifts_shift_date", "shift_date"),
        Index("ix_shifts_supervisor_user_id", "supervisor_user_id"),
    )

    city_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("cities.id", ondelete="RESTRICT"), nullable=False
    )
    ward_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("wards.id", ondelete="SET NULL"), nullable=True
    )
    zone_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("zones.id", ondelete="SET NULL"), nullable=True
    )
    supervisor_user_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    name: Mapped[str] = mapped_column(String(120), nullable=False)
    shift_date: Mapped[date] = mapped_column(nullable=False)
    start_time: Mapped[time] = mapped_column(nullable=False)
    end_time: Mapped[time] = mapped_column(nullable=False)

    city = relationship("City", back_populates="shifts")
    ward = relationship("Ward", back_populates="shifts")
    zone = relationship("Zone", back_populates="shifts")
    supervisor_user = relationship("User", back_populates="supervised_shifts")
    pickup_tasks = relationship("PickupTask", back_populates="shift")
