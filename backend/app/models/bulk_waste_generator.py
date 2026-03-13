from uuid import UUID

from sqlalchemy import Enum as SQLEnum
from sqlalchemy import Float, ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.mixins import ActiveMixin, AuditMixin, Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import ComplianceStatus, GeneratorType, OnboardingStatus


class BulkWasteGenerator(UUIDPrimaryKeyMixin, TimestampMixin, AuditMixin, ActiveMixin, Base):
    __tablename__ = "bulk_waste_generators"
    __table_args__ = (
        Index("ix_bulk_generators_generator_code", "generator_code", unique=True),
        Index("ix_bulk_generators_city_id", "city_id"),
        Index("ix_bulk_generators_ward_id", "ward_id"),
        Index("ix_bulk_generators_zone_id", "zone_id"),
        Index("ix_bulk_generators_qr_tag_id", "qr_tag_id", unique=True),
    )

    organization_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True
    )
    city_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("cities.id", ondelete="RESTRICT"), nullable=False)
    ward_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("wards.id", ondelete="RESTRICT"), nullable=False)
    zone_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("zones.id", ondelete="SET NULL"), nullable=True)
    address_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("addresses.id", ondelete="SET NULL"), nullable=True
    )
    qr_tag_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("qr_code_tags.id", ondelete="SET NULL"), nullable=True
    )

    generator_code: Mapped[str] = mapped_column(String(120), nullable=False)
    entity_name: Mapped[str] = mapped_column(String(220), nullable=False)
    contact_person_name: Mapped[str] = mapped_column(String(200), nullable=False)
    contact_phone: Mapped[str] = mapped_column(String(30), nullable=False)
    contact_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    generator_type: Mapped[GeneratorType] = mapped_column(
        SQLEnum(GeneratorType, name="generator_type", native_enum=False), nullable=False
    )
    estimated_daily_waste_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    compliance_status: Mapped[ComplianceStatus] = mapped_column(
        SQLEnum(ComplianceStatus, name="compliance_status", native_enum=False),
        nullable=False,
        default=ComplianceStatus.UNDER_REVIEW,
        server_default=ComplianceStatus.UNDER_REVIEW.value,
    )
    onboarding_status: Mapped[OnboardingStatus] = mapped_column(
        SQLEnum(OnboardingStatus, name="onboarding_status", native_enum=False),
        nullable=False,
        default=OnboardingStatus.PENDING,
        server_default=OnboardingStatus.PENDING.value,
    )

    organization = relationship("Organization", back_populates="bulk_generators")
    city = relationship("City", back_populates="bulk_generators")
    ward = relationship("Ward", back_populates="bulk_generators")
    zone = relationship("Zone", back_populates="bulk_generators")
    address = relationship("Address", back_populates="bulk_generators")
    qr_tag = relationship("QRCodeTag", back_populates="bulk_generator")
    route_stops = relationship("RouteStop", back_populates="bulk_generator")
    pickup_tasks = relationship("PickupTask", back_populates="bulk_generator")
    recovery_certificates = relationship("RecoveryCertificate", back_populates="bulk_generator")
