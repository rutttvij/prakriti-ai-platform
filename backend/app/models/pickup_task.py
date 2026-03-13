from datetime import date, datetime, time
from uuid import UUID

from sqlalchemy import Boolean, CheckConstraint, Enum as SQLEnum
from sqlalchemy import Float, ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.mixins import ActiveMixin, AuditMixin, Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import OperationalSourceType, PickupStatus, WasteCategory


class PickupTask(UUIDPrimaryKeyMixin, TimestampMixin, AuditMixin, ActiveMixin, Base):
    __tablename__ = "pickup_tasks"
    __table_args__ = (
        CheckConstraint(
            "((household_id IS NOT NULL)::int + (bulk_generator_id IS NOT NULL)::int) = 1",
            name="ck_pickup_tasks_exactly_one_source",
        ),
        Index("ix_pickup_tasks_city_id", "city_id"),
        Index("ix_pickup_tasks_ward_id", "ward_id"),
        Index("ix_pickup_tasks_zone_id", "zone_id"),
        Index("ix_pickup_tasks_route_id", "route_id"),
        Index("ix_pickup_tasks_route_stop_id", "route_stop_id"),
        Index("ix_pickup_tasks_shift_id", "shift_id"),
        Index("ix_pickup_tasks_assigned_worker_id", "assigned_worker_id"),
        Index("ix_pickup_tasks_assigned_vehicle_id", "assigned_vehicle_id"),
        Index("ix_pickup_tasks_source_type", "source_type"),
        Index("ix_pickup_tasks_pickup_status", "pickup_status"),
        Index("ix_pickup_tasks_scheduled_date", "scheduled_date"),
    )

    city_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("cities.id", ondelete="RESTRICT"), nullable=False
    )
    ward_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("wards.id", ondelete="RESTRICT"), nullable=False
    )
    zone_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("zones.id", ondelete="SET NULL"), nullable=True
    )

    route_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("routes.id", ondelete="SET NULL"), nullable=True
    )
    route_stop_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("route_stops.id", ondelete="SET NULL"), nullable=True
    )
    shift_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("shifts.id", ondelete="SET NULL"), nullable=True
    )

    source_type: Mapped[OperationalSourceType] = mapped_column(
        SQLEnum(OperationalSourceType, name="operational_source_type", native_enum=False), nullable=False
    )
    household_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("households.id", ondelete="RESTRICT"), nullable=True
    )
    bulk_generator_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("bulk_waste_generators.id", ondelete="RESTRICT"), nullable=True
    )

    assigned_worker_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("worker_profiles.id", ondelete="SET NULL"), nullable=True
    )
    assigned_vehicle_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("vehicles.id", ondelete="SET NULL"), nullable=True
    )

    scheduled_date: Mapped[date] = mapped_column(nullable=False)
    scheduled_time_window_start: Mapped[time | None] = mapped_column(nullable=True)
    scheduled_time_window_end: Mapped[time | None] = mapped_column(nullable=True)
    actual_start_at: Mapped[datetime | None] = mapped_column(nullable=True)
    actual_completed_at: Mapped[datetime | None] = mapped_column(nullable=True)

    pickup_status: Mapped[PickupStatus] = mapped_column(
        SQLEnum(PickupStatus, name="pickup_status", native_enum=False),
        nullable=False,
        default=PickupStatus.PENDING,
        server_default=PickupStatus.PENDING.value,
    )
    waste_category: Mapped[WasteCategory | None] = mapped_column(
        SQLEnum(WasteCategory, name="waste_category", native_enum=False), nullable=True
    )
    expected_weight_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    actual_weight_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    contamination_flag: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    notes: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    proof_photo_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    city = relationship("City", back_populates="pickup_tasks")
    ward = relationship("Ward", back_populates="pickup_tasks")
    zone = relationship("Zone", back_populates="pickup_tasks")
    route = relationship("Route", back_populates="pickup_tasks")
    route_stop = relationship("RouteStop", back_populates="pickup_tasks")
    shift = relationship("Shift", back_populates="pickup_tasks")
    household = relationship("Household", back_populates="pickup_tasks")
    bulk_generator = relationship("BulkWasteGenerator", back_populates="pickup_tasks")
    assigned_worker = relationship("WorkerProfile", back_populates="pickup_tasks")
    assigned_vehicle = relationship("Vehicle", back_populates="pickup_tasks")
    pickup_logs = relationship("PickupLog", back_populates="pickup_task", cascade="all, delete-orphan")
