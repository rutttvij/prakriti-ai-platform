from datetime import time
from uuid import UUID

from sqlalchemy import CheckConstraint, Enum as SQLEnum
from sqlalchemy import ForeignKey, Index, Integer, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.mixins import ActiveMixin, AuditMixin, Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import OperationalSourceType


class RouteStop(UUIDPrimaryKeyMixin, TimestampMixin, AuditMixin, ActiveMixin, Base):
    __tablename__ = "route_stops"
    __table_args__ = (
        UniqueConstraint("route_id", "stop_sequence", name="uq_route_stops_route_id_stop_sequence"),
        UniqueConstraint("route_id", "household_id", name="uq_route_stops_route_id_household_id"),
        UniqueConstraint("route_id", "bulk_generator_id", name="uq_route_stops_route_id_bulk_generator_id"),
        CheckConstraint(
            "((household_id IS NOT NULL)::int + (bulk_generator_id IS NOT NULL)::int) = 1",
            name="ck_route_stops_exactly_one_source",
        ),
        Index("ix_route_stops_route_id", "route_id"),
        Index("ix_route_stops_source_type", "source_type"),
        Index("ix_route_stops_household_id", "household_id"),
        Index("ix_route_stops_bulk_generator_id", "bulk_generator_id"),
    )

    route_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("routes.id", ondelete="CASCADE"), nullable=False
    )
    stop_sequence: Mapped[int] = mapped_column(Integer, nullable=False)
    source_type: Mapped[OperationalSourceType] = mapped_column(
        SQLEnum(OperationalSourceType, name="operational_source_type", native_enum=False), nullable=False
    )
    household_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("households.id", ondelete="RESTRICT"), nullable=True
    )
    bulk_generator_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("bulk_waste_generators.id", ondelete="RESTRICT"), nullable=True
    )
    expected_time: Mapped[time | None] = mapped_column(nullable=True)

    route = relationship("Route", back_populates="route_stops")
    household = relationship("Household", back_populates="route_stops")
    bulk_generator = relationship("BulkWasteGenerator", back_populates="route_stops")
    pickup_tasks = relationship("PickupTask", back_populates="route_stop")
