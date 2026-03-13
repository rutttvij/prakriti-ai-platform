from uuid import UUID

from sqlalchemy import Boolean, ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.mixins import ActiveMixin, AuditMixin, Base, TimestampMixin, UUIDPrimaryKeyMixin


class User(UUIDPrimaryKeyMixin, TimestampMixin, AuditMixin, ActiveMixin, Base):
    __tablename__ = "users"
    __table_args__ = (
        Index("ix_users_email", "email", unique=True),
        Index("ix_users_organization_id", "organization_id"),
        Index("ix_users_city_id", "city_id"),
        Index("ix_users_ward_id", "ward_id"),
        Index("ix_users_zone_id", "zone_id"),
    )

    organization_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True
    )
    city_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("cities.id", ondelete="SET NULL"), nullable=True
    )
    ward_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("wards.id", ondelete="SET NULL"), nullable=True
    )
    zone_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("zones.id", ondelete="SET NULL"), nullable=True
    )

    full_name: Mapped[str] = mapped_column(String(200), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    is_superuser: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    is_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")

    organization = relationship("Organization", back_populates="users")
    city = relationship("City", back_populates="users")
    ward = relationship("Ward", back_populates="users")
    zone = relationship("Zone", back_populates="users")
    user_roles = relationship("UserRole", back_populates="user", cascade="all, delete-orphan", lazy="selectin")
    worker_profile = relationship("WorkerProfile", back_populates="user", uselist=False)
    supervised_shifts = relationship("Shift", back_populates="supervisor_user")
    facility_receipts_received = relationship("FacilityReceipt", back_populates="received_by_user")
    recovery_certificates_issued = relationship("RecoveryCertificate", back_populates="issued_by_user")
    carbon_verifications = relationship("CarbonVerification", back_populates="verified_by_user")
