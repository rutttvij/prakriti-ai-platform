from uuid import UUID

from sqlalchemy import ForeignKey, Index, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.mixins import ActiveMixin, AuditMixin, Base, TimestampMixin, UUIDPrimaryKeyMixin


class City(UUIDPrimaryKeyMixin, TimestampMixin, AuditMixin, ActiveMixin, Base):
    __tablename__ = "cities"
    __table_args__ = (
        UniqueConstraint("organization_id", "name", name="uq_cities_organization_name"),
        Index("ix_cities_organization_id", "organization_id"),
    )

    organization_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    state: Mapped[str] = mapped_column(String(120), nullable=False)
    country: Mapped[str] = mapped_column(String(120), nullable=False)

    organization = relationship("Organization", back_populates="cities")
    wards = relationship("Ward", back_populates="city", cascade="all, delete-orphan")
    users = relationship("User", back_populates="city")
    households = relationship("Household", back_populates="city")
    bulk_generators = relationship("BulkWasteGenerator", back_populates="city")
    worker_profiles = relationship("WorkerProfile", back_populates="city")
    vehicles = relationship("Vehicle", back_populates="city")
    shifts = relationship("Shift", back_populates="city")
    routes = relationship("Route", back_populates="city")
    pickup_tasks = relationship("PickupTask", back_populates="city")
    processing_facilities = relationship("ProcessingFacility", back_populates="city")
    collected_batches = relationship("CollectedBatch", back_populates="city")
    carbon_projects = relationship("CarbonProject", back_populates="city")
    carbon_ledger_entries = relationship("CarbonLedgerEntry", back_populates="city")
    environmental_summaries = relationship("EnvironmentalSummary", back_populates="city")
