from datetime import date
from uuid import UUID

from sqlalchemy import Date, Enum as SQLEnum
from sqlalchemy import ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.mixins import ActiveMixin, AuditMixin, Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import CarbonProjectStatus, CarbonProjectType


class CarbonProject(UUIDPrimaryKeyMixin, TimestampMixin, AuditMixin, ActiveMixin, Base):
    __tablename__ = "carbon_projects"
    __table_args__ = (
        Index("ix_carbon_projects_project_code", "project_code", unique=True),
        Index("ix_carbon_projects_city_id", "city_id"),
        Index("ix_carbon_projects_ward_id", "ward_id"),
        Index("ix_carbon_projects_project_type", "project_type"),
        Index("ix_carbon_projects_status", "status"),
    )

    city_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("cities.id", ondelete="RESTRICT"), nullable=False
    )
    ward_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("wards.id", ondelete="SET NULL"), nullable=True
    )

    project_code: Mapped[str] = mapped_column(String(80), nullable=False)
    name: Mapped[str] = mapped_column(String(220), nullable=False)
    project_type: Mapped[CarbonProjectType] = mapped_column(
        SQLEnum(CarbonProjectType, name="carbon_project_type", native_enum=False),
        nullable=False,
    )
    methodology_name: Mapped[str] = mapped_column(String(220), nullable=False)
    methodology_version: Mapped[str | None] = mapped_column(String(120), nullable=True)
    standard_body: Mapped[str | None] = mapped_column(String(120), nullable=True)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[CarbonProjectStatus] = mapped_column(
        SQLEnum(CarbonProjectStatus, name="carbon_project_status", native_enum=False),
        nullable=False,
        default=CarbonProjectStatus.DRAFT,
        server_default=CarbonProjectStatus.DRAFT.value,
    )
    description: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    city = relationship("City", back_populates="carbon_projects")
    ward = relationship("Ward", back_populates="carbon_projects")
    carbon_events = relationship("CarbonEvent", back_populates="carbon_project")
