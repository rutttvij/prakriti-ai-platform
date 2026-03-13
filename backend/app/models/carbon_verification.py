from datetime import datetime
from uuid import UUID

from sqlalchemy import CheckConstraint, Enum as SQLEnum
from sqlalchemy import ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.mixins import AuditMixin, Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import VerificationStatus


class CarbonVerification(UUIDPrimaryKeyMixin, TimestampMixin, AuditMixin, Base):
    __tablename__ = "carbon_verifications"
    __table_args__ = (
        CheckConstraint(
            "((carbon_event_id IS NOT NULL)::int + (ledger_entry_id IS NOT NULL)::int) >= 1",
            name="ck_carbon_verifications_at_least_one_target",
        ),
        Index("ix_carbon_verifications_carbon_event_id", "carbon_event_id"),
        Index("ix_carbon_verifications_ledger_entry_id", "ledger_entry_id"),
        Index("ix_carbon_verifications_verification_status", "verification_status"),
    )

    carbon_event_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("carbon_events.id", ondelete="CASCADE"), nullable=True
    )
    ledger_entry_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("carbon_ledger_entries.id", ondelete="CASCADE"), nullable=True
    )
    verified_by_user_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    verification_status: Mapped[VerificationStatus] = mapped_column(
        SQLEnum(VerificationStatus, name="verification_status", native_enum=False),
        nullable=False,
        default=VerificationStatus.PENDING,
        server_default=VerificationStatus.PENDING.value,
    )
    verified_at: Mapped[datetime | None] = mapped_column(nullable=True)
    comments: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    evidence_document_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    discrepancy_notes: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    carbon_event = relationship("CarbonEvent", back_populates="verifications")
    ledger_entry = relationship("CarbonLedgerEntry", back_populates="verifications")
    verified_by_user = relationship("User", back_populates="carbon_verifications")
