from datetime import datetime
from uuid import UUID

from sqlalchemy import Enum as SQLEnum
from sqlalchemy import Float, ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.mixins import AuditMixin, Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import TransferEntityType, TransferStatus


class TransferRecord(UUIDPrimaryKeyMixin, TimestampMixin, AuditMixin, Base):
    __tablename__ = "transfer_records"
    __table_args__ = (
        Index("ix_transfer_records_batch_id", "batch_id"),
        Index("ix_transfer_records_to_facility_id", "to_facility_id"),
        Index("ix_transfer_records_transfer_status", "transfer_status"),
        Index("ix_transfer_records_dispatched_at", "dispatched_at"),
    )

    batch_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("collected_batches.id", ondelete="CASCADE"), nullable=False)
    from_entity_type: Mapped[TransferEntityType] = mapped_column(
        SQLEnum(TransferEntityType, name="transfer_entity_type", native_enum=False), nullable=False
    )
    from_entity_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), nullable=True)
    to_facility_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("processing_facilities.id", ondelete="RESTRICT"), nullable=False
    )

    dispatched_at: Mapped[datetime] = mapped_column(nullable=False)
    received_at: Mapped[datetime | None] = mapped_column(nullable=True)
    dispatched_weight_kg: Mapped[float] = mapped_column(Float, nullable=False)
    received_weight_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    transfer_status: Mapped[TransferStatus] = mapped_column(
        SQLEnum(TransferStatus, name="transfer_status", native_enum=False),
        nullable=False,
        default=TransferStatus.DISPATCHED,
        server_default=TransferStatus.DISPATCHED.value,
    )
    manifest_number: Mapped[str | None] = mapped_column(String(120), nullable=True)
    notes: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    batch = relationship("CollectedBatch", back_populates="transfers")
    to_facility = relationship("ProcessingFacility", back_populates="transfers")
    facility_receipt = relationship("FacilityReceipt", back_populates="transfer_record", uselist=False)
