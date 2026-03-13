from uuid import UUID

from sqlalchemy import Enum as SQLEnum
from sqlalchemy import ForeignKey, Index, Integer, String
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.mixins import ActiveMixin, AuditMixin, Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import DwellingType, OnboardingStatus


class Household(UUIDPrimaryKeyMixin, TimestampMixin, AuditMixin, ActiveMixin, Base):
    __tablename__ = "households"
    __table_args__ = (
        Index("ix_households_household_code", "household_code", unique=True),
        Index("ix_households_city_id", "city_id"),
        Index("ix_households_ward_id", "ward_id"),
        Index("ix_households_zone_id", "zone_id"),
        Index("ix_households_qr_tag_id", "qr_tag_id", unique=True),
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

    household_code: Mapped[str] = mapped_column(String(120), nullable=False)
    household_head_name: Mapped[str] = mapped_column(String(200), nullable=False)
    contact_phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    contact_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    number_of_members: Mapped[int | None] = mapped_column(Integer, nullable=True)
    dwelling_type: Mapped[DwellingType | None] = mapped_column(
        SQLEnum(DwellingType, name="dwelling_type", native_enum=False), nullable=True
    )
    onboarding_status: Mapped[OnboardingStatus] = mapped_column(
        SQLEnum(OnboardingStatus, name="onboarding_status", native_enum=False),
        nullable=False,
        default=OnboardingStatus.PENDING,
        server_default=OnboardingStatus.PENDING.value,
    )

    organization = relationship("Organization", back_populates="households")
    city = relationship("City", back_populates="households")
    ward = relationship("Ward", back_populates="households")
    zone = relationship("Zone", back_populates="households")
    address = relationship("Address", back_populates="households")
    qr_tag = relationship("QRCodeTag", back_populates="household")
