from datetime import datetime
from uuid import UUID

from sqlalchemy import Enum as SQLEnum
from sqlalchemy import Float, ForeignKey, Index, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.mixins import AuditMixin, Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import DebitCreditDirection, LedgerEntryType, VerificationStatus


class CarbonLedgerEntry(UUIDPrimaryKeyMixin, TimestampMixin, AuditMixin, Base):
    __tablename__ = "carbon_ledger_entries"
    __table_args__ = (
        Index("ix_carbon_ledger_entries_ledger_entry_code", "ledger_entry_code", unique=True),
        Index("ix_carbon_ledger_entries_carbon_event_id", "carbon_event_id"),
        Index("ix_carbon_ledger_entries_city_id", "city_id"),
        Index("ix_carbon_ledger_entries_ward_id", "ward_id"),
        Index("ix_carbon_ledger_entries_period", "period_year", "period_month"),
        Index("ix_carbon_ledger_entries_verification_status", "verification_status"),
        Index("ix_carbon_ledger_entries_entry_type", "entry_type"),
    )

    ledger_entry_code: Mapped[str] = mapped_column(String(100), nullable=False)
    carbon_event_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("carbon_events.id", ondelete="CASCADE"), nullable=False
    )
    entry_type: Mapped[LedgerEntryType] = mapped_column(
        SQLEnum(LedgerEntryType, name="ledger_entry_type", native_enum=False), nullable=False
    )
    debit_credit_direction: Mapped[DebitCreditDirection] = mapped_column(
        SQLEnum(DebitCreditDirection, name="debit_credit_direction", native_enum=False), nullable=False
    )
    quantity_kgco2e: Mapped[float] = mapped_column(Float, nullable=False)

    city_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("cities.id", ondelete="SET NULL"), nullable=True
    )
    ward_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("wards.id", ondelete="SET NULL"), nullable=True
    )
    period_month: Mapped[int | None] = mapped_column(Integer, nullable=True)
    period_year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    recorded_at: Mapped[datetime] = mapped_column(nullable=False, server_default=func.now())
    verification_status: Mapped[VerificationStatus] = mapped_column(
        SQLEnum(VerificationStatus, name="verification_status", native_enum=False),
        nullable=False,
        default=VerificationStatus.PENDING,
        server_default=VerificationStatus.PENDING.value,
    )
    remarks: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    carbon_event = relationship("CarbonEvent", back_populates="ledger_entries")
    city = relationship("City", back_populates="carbon_ledger_entries")
    ward = relationship("Ward", back_populates="carbon_ledger_entries")
    verifications = relationship("CarbonVerification", back_populates="ledger_entry")
