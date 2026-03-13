from datetime import datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy import Enum as SQLEnum
from sqlalchemy import Float, ForeignKey, Index, String, func
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.mixins import AuditMixin, Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import PickupEventType


class PickupLog(UUIDPrimaryKeyMixin, TimestampMixin, AuditMixin, Base):
    __tablename__ = "pickup_logs"
    __table_args__ = (
        Index("ix_pickup_logs_pickup_task_id", "pickup_task_id"),
        Index("ix_pickup_logs_worker_profile_id", "worker_profile_id"),
        Index("ix_pickup_logs_event_type", "event_type"),
        Index("ix_pickup_logs_event_at", "event_at"),
    )

    pickup_task_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("pickup_tasks.id", ondelete="CASCADE"), nullable=False
    )
    worker_profile_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("worker_profiles.id", ondelete="CASCADE"), nullable=False
    )
    event_type: Mapped[PickupEventType] = mapped_column(
        SQLEnum(PickupEventType, name="pickup_event_type", native_enum=False), nullable=False
    )

    latitude: Mapped[Decimal | None] = mapped_column(nullable=True)
    longitude: Mapped[Decimal | None] = mapped_column(nullable=True)
    event_at: Mapped[datetime] = mapped_column(nullable=False, server_default=func.now())
    notes: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    weight_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    photo_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    pickup_task = relationship("PickupTask", back_populates="pickup_logs")
    worker_profile = relationship("WorkerProfile", back_populates="pickup_logs")
