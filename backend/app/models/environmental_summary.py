from datetime import datetime
from uuid import UUID

from sqlalchemy import Enum as SQLEnum
from sqlalchemy import Float, ForeignKey, Index, Integer, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.mixins import AuditMixin, Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import SummaryStatus


class EnvironmentalSummary(UUIDPrimaryKeyMixin, TimestampMixin, AuditMixin, Base):
    __tablename__ = "environmental_summaries"
    __table_args__ = (
        UniqueConstraint(
            "city_id",
            "ward_id",
            "reporting_month",
            "reporting_year",
            name="uq_environmental_summaries_city_ward_month_year",
        ),
        Index("ix_environmental_summaries_city_id", "city_id"),
        Index("ix_environmental_summaries_ward_id", "ward_id"),
        Index("ix_environmental_summaries_period", "reporting_year", "reporting_month"),
        Index("ix_environmental_summaries_summary_status", "summary_status"),
    )

    city_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("cities.id", ondelete="RESTRICT"), nullable=False
    )
    ward_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("wards.id", ondelete="SET NULL"), nullable=True
    )

    reporting_month: Mapped[int] = mapped_column(Integer, nullable=False)
    reporting_year: Mapped[int] = mapped_column(Integer, nullable=False)

    total_collected_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    total_processed_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    total_recycled_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    total_composted_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    total_landfilled_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    landfill_diversion_percent: Mapped[float | None] = mapped_column(Float, nullable=True)
    gross_emission_kgco2e: Mapped[float | None] = mapped_column(Float, nullable=True)
    avoided_emission_kgco2e: Mapped[float | None] = mapped_column(Float, nullable=True)
    net_emission_kgco2e: Mapped[float | None] = mapped_column(Float, nullable=True)

    summary_status: Mapped[SummaryStatus] = mapped_column(
        SQLEnum(SummaryStatus, name="summary_status", native_enum=False),
        nullable=False,
        default=SummaryStatus.GENERATED,
        server_default=SummaryStatus.GENERATED.value,
    )
    generated_at: Mapped[datetime] = mapped_column(nullable=False, server_default=func.now())

    city = relationship("City", back_populates="environmental_summaries")
    ward = relationship("Ward", back_populates="environmental_summaries")
