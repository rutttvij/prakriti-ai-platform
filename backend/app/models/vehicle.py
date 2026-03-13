from uuid import UUID

from sqlalchemy import Enum as SQLEnum
from sqlalchemy import Float, ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.mixins import ActiveMixin, AuditMixin, Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import OwnershipType, VehicleType


class Vehicle(UUIDPrimaryKeyMixin, TimestampMixin, AuditMixin, ActiveMixin, Base):
    __tablename__ = "vehicles"
    __table_args__ = (
        Index("ix_vehicles_registration_number", "registration_number", unique=True),
        Index("ix_vehicles_city_id", "city_id"),
        Index("ix_vehicles_ward_id", "ward_id"),
        Index("ix_vehicles_zone_id", "zone_id"),
        Index("ix_vehicles_vehicle_type", "vehicle_type"),
        Index("ix_vehicles_ownership_type", "ownership_type"),
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

    registration_number: Mapped[str] = mapped_column(String(60), nullable=False)
    vehicle_type: Mapped[VehicleType] = mapped_column(
        SQLEnum(VehicleType, name="vehicle_type", native_enum=False), nullable=False
    )
    capacity_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    ownership_type: Mapped[OwnershipType] = mapped_column(
        SQLEnum(OwnershipType, name="ownership_type", native_enum=False), nullable=False
    )

    city = relationship("City", back_populates="vehicles")
    ward = relationship("Ward", back_populates="vehicles")
    zone = relationship("Zone", back_populates="vehicles")
    pickup_tasks = relationship("PickupTask", back_populates="assigned_vehicle")
    collected_batches = relationship("CollectedBatch", back_populates="assigned_vehicle")
    landfill_records = relationship("LandfillRecord", back_populates="transported_by_vehicle")
