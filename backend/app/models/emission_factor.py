from datetime import date

from sqlalchemy import Date, Enum as SQLEnum
from sqlalchemy import Float, Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.mixins import ActiveMixin, AuditMixin, Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import ProcessType, WasteType


class EmissionFactor(UUIDPrimaryKeyMixin, TimestampMixin, AuditMixin, ActiveMixin, Base):
    __tablename__ = "emission_factors"
    __table_args__ = (
        Index("ix_emission_factors_factor_code", "factor_code", unique=True),
        Index("ix_emission_factors_waste_type", "waste_type"),
        Index("ix_emission_factors_process_type", "process_type"),
        Index("ix_emission_factors_effective_from", "effective_from"),
        Index("ix_emission_factors_effective_to", "effective_to"),
    )

    factor_code: Mapped[str] = mapped_column(String(80), nullable=False)
    factor_name: Mapped[str] = mapped_column(String(220), nullable=False)
    waste_type: Mapped[WasteType] = mapped_column(
        SQLEnum(WasteType, name="waste_type", native_enum=False), nullable=False
    )
    process_type: Mapped[ProcessType | None] = mapped_column(
        SQLEnum(ProcessType, name="process_type", native_enum=False), nullable=True
    )
    factor_unit: Mapped[str] = mapped_column(String(80), nullable=False)
    factor_value: Mapped[float] = mapped_column(Float, nullable=False)
    source_standard: Mapped[str | None] = mapped_column(String(220), nullable=True)
    geography: Mapped[str | None] = mapped_column(String(220), nullable=True)
    effective_from: Mapped[date] = mapped_column(Date, nullable=False)
    effective_to: Mapped[date | None] = mapped_column(Date, nullable=True)
    methodology_reference: Mapped[str | None] = mapped_column(String(500), nullable=True)

    carbon_events = relationship("CarbonEvent", back_populates="factor")
