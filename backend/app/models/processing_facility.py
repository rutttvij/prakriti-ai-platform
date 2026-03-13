from uuid import UUID

from sqlalchemy import Enum as SQLEnum
from sqlalchemy import Float, ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.mixins import ActiveMixin, AuditMixin, Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import FacilityType


class ProcessingFacility(UUIDPrimaryKeyMixin, TimestampMixin, AuditMixin, ActiveMixin, Base):
    __tablename__ = "processing_facilities"
    __table_args__ = (
        Index("ix_processing_facilities_facility_code", "facility_code", unique=True),
        Index("ix_processing_facilities_city_id", "city_id"),
        Index("ix_processing_facilities_ward_id", "ward_id"),
        Index("ix_processing_facilities_zone_id", "zone_id"),
        Index("ix_processing_facilities_facility_type", "facility_type"),
    )

    city_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("cities.id", ondelete="RESTRICT"), nullable=False)
    ward_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("wards.id", ondelete="SET NULL"), nullable=True)
    zone_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("zones.id", ondelete="SET NULL"), nullable=True)
    address_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("addresses.id", ondelete="SET NULL"), nullable=True)

    facility_code: Mapped[str] = mapped_column(String(80), nullable=False)
    name: Mapped[str] = mapped_column(String(220), nullable=False)
    facility_type: Mapped[FacilityType] = mapped_column(SQLEnum(FacilityType, name="facility_type", native_enum=False), nullable=False)
    operator_name: Mapped[str | None] = mapped_column(String(220), nullable=True)
    license_number: Mapped[str | None] = mapped_column(String(120), nullable=True)
    capacity_kg_per_day: Mapped[float | None] = mapped_column(Float, nullable=True)

    city = relationship("City", back_populates="processing_facilities")
    ward = relationship("Ward", back_populates="processing_facilities")
    zone = relationship("Zone", back_populates="processing_facilities")
    address = relationship("Address", back_populates="processing_facilities")
    transfers = relationship("TransferRecord", back_populates="to_facility")
    facility_receipts = relationship("FacilityReceipt", back_populates="facility")
    processing_records = relationship("ProcessingRecord", back_populates="facility")
    landfill_records = relationship("LandfillRecord", back_populates="facility")
    recovery_certificates = relationship("RecoveryCertificate", back_populates="facility")
    carbon_events = relationship("CarbonEvent", back_populates="facility")
