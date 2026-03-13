from datetime import date
from uuid import UUID

from sqlalchemy import Date, Enum as SQLEnum
from sqlalchemy import Float, ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.mixins import AuditMixin, Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import (
    CarbonCalculationStatus,
    CarbonEventType,
    CarbonSourceEntityType,
    WasteType,
)


class CarbonEvent(UUIDPrimaryKeyMixin, TimestampMixin, AuditMixin, Base):
    __tablename__ = "carbon_events"
    __table_args__ = (
        Index("ix_carbon_events_event_code", "event_code", unique=True),
        Index("ix_carbon_events_event_type", "event_type"),
        Index("ix_carbon_events_waste_type", "waste_type"),
        Index("ix_carbon_events_batch_id", "batch_id"),
        Index("ix_carbon_events_facility_id", "facility_id"),
        Index("ix_carbon_events_event_date", "event_date"),
        Index("ix_carbon_events_calculation_status", "calculation_status"),
    )

    carbon_project_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("carbon_projects.id", ondelete="SET NULL"), nullable=True
    )
    event_code: Mapped[str] = mapped_column(String(100), nullable=False)

    source_entity_type: Mapped[CarbonSourceEntityType] = mapped_column(
        SQLEnum(CarbonSourceEntityType, name="carbon_source_entity_type", native_enum=False),
        nullable=False,
    )
    source_entity_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), nullable=True)

    batch_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("collected_batches.id", ondelete="SET NULL"), nullable=True
    )
    facility_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("processing_facilities.id", ondelete="SET NULL"), nullable=True
    )
    processing_record_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("processing_records.id", ondelete="SET NULL"), nullable=True
    )
    landfill_record_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("landfill_records.id", ondelete="SET NULL"), nullable=True
    )
    recovery_certificate_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("recovery_certificates.id", ondelete="SET NULL"), nullable=True
    )

    event_type: Mapped[CarbonEventType] = mapped_column(
        SQLEnum(CarbonEventType, name="carbon_event_type", native_enum=False), nullable=False
    )
    waste_type: Mapped[WasteType] = mapped_column(
        SQLEnum(WasteType, name="waste_type", native_enum=False), nullable=False
    )
    quantity_kg: Mapped[float] = mapped_column(Float, nullable=False)

    factor_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("emission_factors.id", ondelete="SET NULL"), nullable=True
    )
    factor_value: Mapped[float | None] = mapped_column(Float, nullable=True)
    gross_emission_kgco2e: Mapped[float | None] = mapped_column(Float, nullable=True)
    avoided_emission_kgco2e: Mapped[float | None] = mapped_column(Float, nullable=True)
    net_emission_kgco2e: Mapped[float | None] = mapped_column(Float, nullable=True)

    event_date: Mapped[date] = mapped_column(Date, nullable=False)
    methodology_snapshot: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    calculation_status: Mapped[CarbonCalculationStatus] = mapped_column(
        SQLEnum(CarbonCalculationStatus, name="carbon_calculation_status", native_enum=False),
        nullable=False,
        default=CarbonCalculationStatus.PENDING,
        server_default=CarbonCalculationStatus.PENDING.value,
    )
    notes: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    carbon_project = relationship("CarbonProject", back_populates="carbon_events")
    batch = relationship("CollectedBatch", back_populates="carbon_events")
    facility = relationship("ProcessingFacility", back_populates="carbon_events")
    processing_record = relationship("ProcessingRecord", back_populates="carbon_events")
    landfill_record = relationship("LandfillRecord", back_populates="carbon_events")
    recovery_certificate = relationship("RecoveryCertificate", back_populates="carbon_events")
    factor = relationship("EmissionFactor", back_populates="carbon_events")
    ledger_entries = relationship("CarbonLedgerEntry", back_populates="carbon_event", cascade="all, delete-orphan")
    verifications = relationship("CarbonVerification", back_populates="carbon_event")
