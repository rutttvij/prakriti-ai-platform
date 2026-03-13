from datetime import date
from uuid import UUID

from sqlalchemy import Enum as SQLEnum
from sqlalchemy import Float, ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.mixins import ActiveMixin, AuditMixin, Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import BatchStatus


class CollectedBatch(UUIDPrimaryKeyMixin, TimestampMixin, AuditMixin, ActiveMixin, Base):
    __tablename__ = "collected_batches"
    __table_args__ = (
        Index("ix_collected_batches_batch_code", "batch_code", unique=True),
        Index("ix_collected_batches_city_id", "city_id"),
        Index("ix_collected_batches_ward_id", "ward_id"),
        Index("ix_collected_batches_zone_id", "zone_id"),
        Index("ix_collected_batches_batch_status", "batch_status"),
        Index("ix_collected_batches_created_date", "created_date"),
    )

    city_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("cities.id", ondelete="RESTRICT"), nullable=False)
    ward_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("wards.id", ondelete="RESTRICT"), nullable=False)
    zone_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("zones.id", ondelete="SET NULL"), nullable=True)

    assigned_vehicle_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("vehicles.id", ondelete="SET NULL"), nullable=True)
    assigned_worker_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("worker_profiles.id", ondelete="SET NULL"), nullable=True)
    origin_route_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("routes.id", ondelete="SET NULL"), nullable=True)

    batch_code: Mapped[str] = mapped_column(String(80), nullable=False)
    created_date: Mapped[date] = mapped_column(nullable=False)
    source_type_summary: Mapped[str | None] = mapped_column(String(150), nullable=True)
    total_weight_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    batch_status: Mapped[BatchStatus] = mapped_column(
        SQLEnum(BatchStatus, name="batch_status", native_enum=False),
        nullable=False,
        default=BatchStatus.CREATED,
        server_default=BatchStatus.CREATED.value,
    )
    notes: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    city = relationship("City", back_populates="collected_batches")
    ward = relationship("Ward", back_populates="collected_batches")
    zone = relationship("Zone", back_populates="collected_batches")
    assigned_vehicle = relationship("Vehicle", back_populates="collected_batches")
    assigned_worker = relationship("WorkerProfile", back_populates="collected_batches")
    origin_route = relationship("Route", back_populates="collected_batches")
    transfers = relationship("TransferRecord", back_populates="batch", cascade="all, delete-orphan")
    processing_records = relationship("ProcessingRecord", back_populates="batch")
    landfill_records = relationship("LandfillRecord", back_populates="batch")
    recovery_certificates = relationship("RecoveryCertificate", back_populates="batch")
    carbon_events = relationship("CarbonEvent", back_populates="batch")
