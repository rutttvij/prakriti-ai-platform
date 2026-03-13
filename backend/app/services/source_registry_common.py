from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.address import Address
from app.models.city import City
from app.models.organization import Organization
from app.models.ward import Ward
from app.models.zone import Zone


def validate_location_hierarchy(
    db: Session,
    city_id: UUID,
    ward_id: UUID,
    zone_id: UUID | None,
    organization_id: UUID | None,
) -> tuple[Organization | None, City, Ward, Zone | None]:
    organization = db.get(Organization, organization_id) if organization_id else None
    city = db.get(City, city_id)
    ward = db.get(Ward, ward_id)
    zone = db.get(Zone, zone_id) if zone_id else None

    if organization_id and not organization:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")
    if not city:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="City not found")
    if not ward:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ward not found")
    if zone_id and not zone:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Zone not found")

    if ward.city_id != city.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ward does not belong to city")
    if zone and zone.ward_id != ward.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Zone does not belong to ward")
    if organization and city.organization_id != organization.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="City does not belong to organization")

    return organization, city, ward, zone


def validate_address_if_present(db: Session, address_id: UUID | None) -> Address | None:
    if not address_id:
        return None
    address = db.get(Address, address_id)
    if not address:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found")
    return address
