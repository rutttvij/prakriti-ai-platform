from datetime import date
from uuid import UUID

from sqlalchemy import Enum as SQLEnum
from sqlalchemy import Float, ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.mixins import AuditMixin, Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import DisposalMethod


class LandfillRecord(UUIDPrimaryKeyMixin, TimestampMixin, AuditMixin, Base):
    __tablename__ = "landfill_records"
    __table_args__ = (
        Index("ix_landfill_records_facility_id", "facility_id"),
        Index("ix_landfill_records_batch_id", "batch_id"),
        Index("ix_landfill_records_disposal_date", "disposal_date"),
        Index("ix_landfill_records_disposal_method", "disposal_method"),
    )

    facility_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("processing_facilities.id", ondelete="RESTRICT"), nullable=False
    )
    batch_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("collected_batches.id", ondelete="SET NULL"), nullable=True
    )
    transported_by_vehicle_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("vehicles.id", ondelete="SET NULL"), nullable=True
    )

    disposal_date: Mapped[date] = mapped_column(nullable=False)
    waste_weight_kg: Mapped[float] = mapped_column(Float, nullable=False)
    disposal_method: Mapped[DisposalMethod] = mapped_column(
        SQLEnum(DisposalMethod, name="disposal_method", native_enum=False), nullable=False
    )
    landfill_cell: Mapped[str | None] = mapped_column(String(120), nullable=True)
    notes: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    facility = relationship("ProcessingFacility", back_populates="landfill_records")
    batch = relationship("CollectedBatch", back_populates="landfill_records")
    transported_by_vehicle = relationship("Vehicle", back_populates="landfill_records")
    carbon_events = relationship("CarbonEvent", back_populates="landfill_record")
