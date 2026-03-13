from datetime import date
from uuid import UUID

from sqlalchemy import Enum as SQLEnum
from sqlalchemy import Float, ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.mixins import AuditMixin, Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import RecoveryMethod, VerificationStatus, WasteType


class RecoveryCertificate(UUIDPrimaryKeyMixin, TimestampMixin, AuditMixin, Base):
    __tablename__ = "recovery_certificates"
    __table_args__ = (
        Index("ix_recovery_certificates_certificate_number", "certificate_number", unique=True),
        Index("ix_recovery_certificates_facility_id", "facility_id"),
        Index("ix_recovery_certificates_batch_id", "batch_id"),
        Index("ix_recovery_certificates_bulk_generator_id", "bulk_generator_id"),
        Index("ix_recovery_certificates_waste_type", "waste_type"),
        Index("ix_recovery_certificates_verification_status", "verification_status"),
    )

    certificate_number: Mapped[str] = mapped_column(String(120), nullable=False)
    facility_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("processing_facilities.id", ondelete="RESTRICT"), nullable=False
    )
    batch_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("collected_batches.id", ondelete="RESTRICT"), nullable=False
    )
    bulk_generator_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("bulk_waste_generators.id", ondelete="SET NULL"), nullable=True
    )
    issued_by_user_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    issue_date: Mapped[date] = mapped_column(nullable=False)
    waste_type: Mapped[WasteType] = mapped_column(SQLEnum(WasteType, name="waste_type", native_enum=False), nullable=False)
    certified_weight_kg: Mapped[float] = mapped_column(Float, nullable=False)
    recovery_method: Mapped[RecoveryMethod] = mapped_column(
        SQLEnum(RecoveryMethod, name="recovery_method", native_enum=False), nullable=False
    )
    verification_status: Mapped[VerificationStatus] = mapped_column(
        SQLEnum(VerificationStatus, name="verification_status", native_enum=False),
        nullable=False,
        default=VerificationStatus.PENDING,
        server_default=VerificationStatus.PENDING.value,
    )
    certificate_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    notes: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    facility = relationship("ProcessingFacility", back_populates="recovery_certificates")
    batch = relationship("CollectedBatch", back_populates="recovery_certificates")
    bulk_generator = relationship("BulkWasteGenerator", back_populates="recovery_certificates")
    issued_by_user = relationship("User", back_populates="recovery_certificates_issued")
    carbon_events = relationship("CarbonEvent", back_populates="recovery_certificate")
