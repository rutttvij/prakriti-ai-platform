from uuid import UUID

from sqlalchemy import Enum as SQLEnum
from sqlalchemy import ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.mixins import ActiveMixin, AuditMixin, Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import RouteType


class Route(UUIDPrimaryKeyMixin, TimestampMixin, AuditMixin, ActiveMixin, Base):
    __tablename__ = "routes"
    __table_args__ = (
        Index("ix_routes_route_code", "route_code", unique=True),
        Index("ix_routes_city_id", "city_id"),
        Index("ix_routes_ward_id", "ward_id"),
        Index("ix_routes_zone_id", "zone_id"),
        Index("ix_routes_route_type", "route_type"),
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

    route_code: Mapped[str] = mapped_column(String(80), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    route_type: Mapped[RouteType] = mapped_column(
        SQLEnum(RouteType, name="route_type", native_enum=False), nullable=False
    )

    city = relationship("City", back_populates="routes")
    ward = relationship("Ward", back_populates="routes")
    zone = relationship("Zone", back_populates="routes")
    route_stops = relationship("RouteStop", back_populates="route", cascade="all, delete-orphan")
    pickup_tasks = relationship("PickupTask", back_populates="route")
    collected_batches = relationship("CollectedBatch", back_populates="origin_route")
