from datetime import date
from uuid import UUID

from sqlalchemy import Enum as SQLEnum
from sqlalchemy import ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.mixins import ActiveMixin, AuditMixin, Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import EmploymentStatus


class WorkerProfile(UUIDPrimaryKeyMixin, TimestampMixin, AuditMixin, ActiveMixin, Base):
    __tablename__ = "worker_profiles"
    __table_args__ = (
        Index("ix_worker_profiles_user_id", "user_id", unique=True),
        Index("ix_worker_profiles_employee_code", "employee_code", unique=True),
        Index("ix_worker_profiles_city_id", "city_id"),
        Index("ix_worker_profiles_ward_id", "ward_id"),
        Index("ix_worker_profiles_zone_id", "zone_id"),
        Index("ix_worker_profiles_employment_status", "employment_status"),
    )

    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    city_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("cities.id", ondelete="RESTRICT"), nullable=False
    )
    ward_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("wards.id", ondelete="SET NULL"), nullable=True
    )
    zone_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("zones.id", ondelete="SET NULL"), nullable=True
    )

    employee_code: Mapped[str] = mapped_column(String(120), nullable=False)
    designation: Mapped[str] = mapped_column(String(150), nullable=False)
    employment_status: Mapped[EmploymentStatus] = mapped_column(
        SQLEnum(EmploymentStatus, name="employment_status", native_enum=False),
        nullable=False,
        default=EmploymentStatus.ACTIVE,
        server_default=EmploymentStatus.ACTIVE.value,
    )
    joined_on: Mapped[date | None] = mapped_column(nullable=True)

    user = relationship("User", back_populates="worker_profile")
    city = relationship("City", back_populates="worker_profiles")
    ward = relationship("Ward", back_populates="worker_profiles")
    zone = relationship("Zone", back_populates="worker_profiles")
    pickup_tasks = relationship("PickupTask", back_populates="assigned_worker")
    pickup_logs = relationship("PickupLog", back_populates="worker_profile")
    collected_batches = relationship("CollectedBatch", back_populates="assigned_worker")
