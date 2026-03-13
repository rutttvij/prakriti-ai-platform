from datetime import datetime
from uuid import UUID

from sqlalchemy import Enum as SQLEnum
from sqlalchemy import Float, ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.mixins import AuditMixin, Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import ProcessType, ProcessingStatus


class ProcessingRecord(UUIDPrimaryKeyMixin, TimestampMixin, AuditMixin, Base):
    __tablename__ = "processing_records"
    __table_args__ = (
        Index("ix_processing_records_facility_id", "facility_id"),
        Index("ix_processing_records_batch_id", "batch_id"),
        Index("ix_processing_records_process_type", "process_type"),
        Index("ix_processing_records_processing_status", "processing_status"),
        Index("ix_processing_records_processed_at", "processed_at"),
    )

    facility_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("processing_facilities.id", ondelete="RESTRICT"), nullable=False
    )
    batch_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("collected_batches.id", ondelete="RESTRICT"), nullable=False
    )

    processed_at: Mapped[datetime] = mapped_column(nullable=False)
    process_type: Mapped[ProcessType] = mapped_column(
        SQLEnum(ProcessType, name="process_type", native_enum=False), nullable=False
    )
    input_weight_kg: Mapped[float] = mapped_column(Float, nullable=False)
    output_recovered_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    output_rejected_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    residue_to_landfill_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    organic_compost_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    recyclable_plastic_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    recyclable_metal_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    recyclable_paper_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    recyclable_glass_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    energy_recovered_kwh: Mapped[float | None] = mapped_column(Float, nullable=True)
    processing_status: Mapped[ProcessingStatus] = mapped_column(
        SQLEnum(ProcessingStatus, name="processing_status", native_enum=False),
        nullable=False,
        default=ProcessingStatus.INITIATED,
        server_default=ProcessingStatus.INITIATED.value,
    )
    notes: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    facility = relationship("ProcessingFacility", back_populates="processing_records")
    batch = relationship("CollectedBatch", back_populates="processing_records")
    carbon_events = relationship("CarbonEvent", back_populates="processing_record")
