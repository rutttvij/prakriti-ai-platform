from datetime import datetime
from uuid import UUID

from sqlalchemy import Enum as SQLEnum
from sqlalchemy import Float, ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.mixins import AuditMixin, Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import VerificationStatus


class FacilityReceipt(UUIDPrimaryKeyMixin, TimestampMixin, AuditMixin, Base):
    __tablename__ = "facility_receipts"
    __table_args__ = (
        Index("ix_facility_receipts_transfer_record_id", "transfer_record_id", unique=True),
        Index("ix_facility_receipts_facility_id", "facility_id"),
        Index("ix_facility_receipts_verification_status", "verification_status"),
    )

    transfer_record_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("transfer_records.id", ondelete="CASCADE"), nullable=False
    )
    facility_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("processing_facilities.id", ondelete="RESTRICT"), nullable=False
    )
    received_by_user_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    received_at: Mapped[datetime] = mapped_column(nullable=False)
    gross_weight_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    net_weight_kg: Mapped[float] = mapped_column(Float, nullable=False)
    contamination_notes: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    verification_status: Mapped[VerificationStatus] = mapped_column(
        SQLEnum(VerificationStatus, name="verification_status", native_enum=False),
        nullable=False,
        default=VerificationStatus.PENDING,
        server_default=VerificationStatus.PENDING.value,
    )
    proof_document_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    notes: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    transfer_record = relationship("TransferRecord", back_populates="facility_receipt")
    facility = relationship("ProcessingFacility", back_populates="facility_receipts")
    received_by_user = relationship("User", back_populates="facility_receipts_received")
