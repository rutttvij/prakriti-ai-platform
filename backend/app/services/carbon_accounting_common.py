from datetime import date
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.carbon_event import CarbonEvent
from app.models.collected_batch import CollectedBatch
from app.models.emission_factor import EmissionFactor
from app.models.enums import CarbonEventType, ProcessType, WasteType
from app.models.landfill_record import LandfillRecord
from app.models.processing_facility import ProcessingFacility
from app.models.processing_record import ProcessingRecord
from app.models.recovery_certificate import RecoveryCertificate


AVOIDED_EVENT_TYPES = {
    CarbonEventType.RECYCLING_AVOIDED,
    CarbonEventType.COMPOSTING_AVOIDED,
    CarbonEventType.RECOVERY_AVOIDED,
}


def get_emission_factor(db: Session, factor_id: UUID) -> EmissionFactor:
    factor = db.get(EmissionFactor, factor_id)
    if not factor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Emission factor not found")
    return factor


def validate_factor_active_for_date(factor: EmissionFactor, event_date: date) -> None:
    if not factor.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Emission factor is inactive")
    if factor.effective_from > event_date:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Emission factor is not yet effective")
    if factor.effective_to and factor.effective_to < event_date:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Emission factor has expired for the event date")


def lookup_emission_factor(
    db: Session,
    waste_type: WasteType,
    event_date: date,
    process_type: ProcessType | None,
    geography_candidates: list[str] | None,
) -> EmissionFactor | None:
    query = select(EmissionFactor).where(
        EmissionFactor.is_active.is_(True),
        EmissionFactor.waste_type == waste_type,
        EmissionFactor.effective_from <= event_date,
    )
    query = query.where((EmissionFactor.effective_to.is_(None)) | (EmissionFactor.effective_to >= event_date))

    if process_type:
        query = query.where((EmissionFactor.process_type == process_type) | (EmissionFactor.process_type.is_(None)))

    factors = list(db.scalars(query).all())
    if not factors:
        return None

    candidates = geography_candidates or []

    def rank(factor: EmissionFactor) -> tuple[int, int, int]:
        # lower rank wins
        if factor.geography is None:
            geo_rank = 2
        elif factor.geography in candidates:
            geo_rank = candidates.index(factor.geography)
        else:
            geo_rank = 3

        process_rank = 0 if (process_type and factor.process_type == process_type) else 1
        # Prefer the most recent applicable factor version for deterministic selection.
        return (geo_rank, process_rank, -factor.effective_from.toordinal())

    factors.sort(key=rank)
    chosen = factors[0]
    if rank(chosen)[0] == 3:
        # no geography match and no generic row
        return None
    return chosen


def derive_scope_from_event_links(
    batch: CollectedBatch | None,
    facility: ProcessingFacility | None,
    processing_record: ProcessingRecord | None,
    landfill_record: LandfillRecord | None,
    recovery_certificate: RecoveryCertificate | None,
) -> tuple[UUID | None, UUID | None, UUID | None]:
    city_id = None
    ward_id = None
    facility_id = facility.id if facility else None

    refs = []
    if batch:
        refs.append((batch.city_id, batch.ward_id))
    if facility:
        refs.append((facility.city_id, facility.ward_id))
    if processing_record:
        refs.append((processing_record.batch.city_id, processing_record.batch.ward_id))
        facility_id = processing_record.facility_id
    if landfill_record:
        refs.append((landfill_record.facility.city_id, landfill_record.facility.ward_id))
        facility_id = landfill_record.facility_id
    if recovery_certificate:
        refs.append((recovery_certificate.batch.city_id, recovery_certificate.batch.ward_id))
        facility_id = recovery_certificate.facility_id

    for c_id, w_id in refs:
        if city_id is None:
            city_id = c_id
        elif city_id != c_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Linked entities have inconsistent city scope")

        if ward_id is None:
            ward_id = w_id
        elif ward_id and w_id and ward_id != w_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Linked entities have inconsistent ward scope")

    return city_id, ward_id, facility_id


def derive_scope_from_carbon_event(event: CarbonEvent) -> tuple[UUID | None, UUID | None, UUID | None]:
    if event.batch:
        return event.batch.city_id, event.batch.ward_id, event.facility_id
    if event.facility:
        return event.facility.city_id, event.facility.ward_id, event.facility_id
    if event.processing_record:
        return event.processing_record.batch.city_id, event.processing_record.batch.ward_id, event.processing_record.facility_id
    if event.landfill_record:
        return event.landfill_record.facility.city_id, event.landfill_record.facility.ward_id, event.landfill_record.facility_id
    if event.recovery_certificate:
        return event.recovery_certificate.batch.city_id, event.recovery_certificate.batch.ward_id, event.recovery_certificate.facility_id
    return None, None, None


def calculate_emission_values(event_type: CarbonEventType, quantity_kg: float, factor_value: float) -> tuple[float, float, float]:
    if quantity_kg <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="quantity_kg must be positive")
    if factor_value <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="factor_value must be positive")

    value = quantity_kg * factor_value
    if event_type in AVOIDED_EVENT_TYPES:
        gross = 0.0
        avoided = value
    else:
        gross = value
        avoided = 0.0
    net = gross - avoided
    return gross, avoided, net
