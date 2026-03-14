from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, date, datetime, time, timedelta
from decimal import Decimal
from typing import Iterable

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import get_password_hash
from app.db.session import SessionLocal
from app.models.address import Address
from app.models.bulk_waste_generator import BulkWasteGenerator
from app.models.carbon_event import CarbonEvent
from app.models.carbon_ledger_entry import CarbonLedgerEntry
from app.models.carbon_project import CarbonProject
from app.models.carbon_verification import CarbonVerification
from app.models.city import City
from app.models.collected_batch import CollectedBatch
from app.models.emission_factor import EmissionFactor
from app.models.environmental_summary import EnvironmentalSummary
from app.models.facility_receipt import FacilityReceipt
from app.models.household import Household
from app.models.landfill_record import LandfillRecord
from app.models.organization import Organization
from app.models.pickup_log import PickupLog
from app.models.pickup_task import PickupTask
from app.models.processing_facility import ProcessingFacility
from app.models.processing_record import ProcessingRecord
from app.models.recovery_certificate import RecoveryCertificate
from app.models.route import Route
from app.models.route_stop import RouteStop
from app.models.shift import Shift
from app.models.transfer_record import TransferRecord
from app.models.user import User
from app.models.vehicle import Vehicle
from app.models.ward import Ward
from app.models.worker_profile import WorkerProfile
from app.models.zone import Zone
from app.models.enums import (
    BatchStatus,
    CarbonCalculationStatus,
    CarbonEventType,
    CarbonProjectStatus,
    CarbonProjectType,
    CarbonSourceEntityType,
    ComplianceStatus,
    DebitCreditDirection,
    DisposalMethod,
    DwellingType,
    EmploymentStatus,
    FacilityType,
    GeneratorType,
    LedgerEntryType,
    OnboardingStatus,
    OperationalSourceType,
    OwnershipType,
    PickupEventType,
    PickupStatus,
    ProcessType,
    ProcessingStatus,
    RecoveryMethod,
    RouteType,
    SummaryStatus,
    TransferEntityType,
    TransferStatus,
    VerificationStatus,
    VehicleType,
    WasteType,
)
from app.services.role_service import assign_role, seed_system_roles

DEMO_PASSWORD = "Demo@1234"


@dataclass
class DemoSeedSummary:
    organization_slug: str
    city_name: str
    account_emails: list[str]
    password_hint: str


def _get_or_create(db: Session, model, defaults: dict | None = None, **filters):
    instance = db.scalar(select(model).filter_by(**filters))
    if instance:
        return instance
    payload = {**filters, **(defaults or {})}
    instance = model(**payload)
    db.add(instance)
    db.flush()
    return instance


def _ensure_user(
    db: Session,
    *,
    email: str,
    full_name: str,
    role_code: str,
    organization_id,
    city_id,
    ward_id,
    zone_id,
    phone: str,
    is_superuser: bool = False,
) -> User:
    user = db.scalar(select(User).where(User.email == email))
    if not user:
        user = User(
            email=email,
            full_name=full_name,
            phone=phone,
            organization_id=organization_id,
            city_id=city_id,
            ward_id=ward_id,
            zone_id=zone_id,
            hashed_password=get_password_hash(DEMO_PASSWORD),
            is_superuser=is_superuser,
            is_active=True,
            is_verified=True,
        )
        db.add(user)
        db.flush()
    else:
        user.full_name = full_name
        user.phone = phone
        user.organization_id = organization_id
        user.city_id = city_id
        user.ward_id = ward_id
        user.zone_id = zone_id
        user.is_active = True
        user.is_verified = True

    assign_role(db, user, role_code)
    return user


def _ensure_shift(db: Session, *, city_id, ward_id, zone_id, supervisor_user_id, name: str, shift_date: date, start: time, end: time) -> Shift:
    shift = db.scalar(
        select(Shift).where(Shift.city_id == city_id, Shift.name == name, Shift.shift_date == shift_date)
    )
    if shift:
        return shift
    shift = Shift(
        city_id=city_id,
        ward_id=ward_id,
        zone_id=zone_id,
        supervisor_user_id=supervisor_user_id,
        name=name,
        shift_date=shift_date,
        start_time=start,
        end_time=end,
    )
    db.add(shift)
    db.flush()
    return shift


def _ensure_pickup_task(
    db: Session,
    *,
    marker: str,
    city_id,
    ward_id,
    zone_id,
    route_id,
    route_stop_id,
    shift_id,
    source_type: OperationalSourceType,
    household_id,
    bulk_generator_id,
    assigned_worker_id,
    assigned_vehicle_id,
    scheduled_date: date,
    status: PickupStatus,
    expected_weight: float,
    actual_weight: float | None,
) -> PickupTask:
    task = db.scalar(select(PickupTask).where(PickupTask.notes == marker))
    if task:
        return task

    now = datetime.now(UTC).replace(tzinfo=None)
    task = PickupTask(
        city_id=city_id,
        ward_id=ward_id,
        zone_id=zone_id,
        route_id=route_id,
        route_stop_id=route_stop_id,
        shift_id=shift_id,
        source_type=source_type,
        household_id=household_id,
        bulk_generator_id=bulk_generator_id,
        assigned_worker_id=assigned_worker_id,
        assigned_vehicle_id=assigned_vehicle_id,
        scheduled_date=scheduled_date,
        scheduled_time_window_start=time(6, 30),
        scheduled_time_window_end=time(9, 30),
        pickup_status=status,
        expected_weight_kg=expected_weight,
        actual_weight_kg=actual_weight,
        contamination_flag=False,
        notes=marker,
        actual_start_at=now - timedelta(hours=3) if status in {PickupStatus.IN_PROGRESS, PickupStatus.COMPLETED, PickupStatus.MISSED} else None,
        actual_completed_at=now - timedelta(hours=2) if status == PickupStatus.COMPLETED else None,
    )
    db.add(task)
    db.flush()
    return task


def run_demo_seed(force: bool = False) -> DemoSeedSummary:
    settings = get_settings()
    if settings.environment.lower() in {"production", "prod"} and not force:
        raise RuntimeError("Demo seed is blocked in production. Pass force=True only if you intentionally want this.")

    with SessionLocal() as db:
        seed_system_roles(db)

        org = _get_or_create(
            db,
            Organization,
            slug="prakriti-demo-platform",
            defaults={
                "name": "Prakriti Demo Municipal Platform",
                "type": "PLATFORM_OWNER",
                "is_active": True,
            },
        )

        city = _get_or_create(
            db,
            City,
            organization_id=org.id,
            name="Pune",
            defaults={"state": "Maharashtra", "country": "India", "is_active": True},
        )

        ward_a = _get_or_create(db, Ward, city_id=city.id, code="PUN-W01", defaults={"name": "Shivajinagar", "is_active": True})
        ward_b = _get_or_create(db, Ward, city_id=city.id, code="PUN-W02", defaults={"name": "Kothrud", "is_active": True})
        ward_c = _get_or_create(db, Ward, city_id=city.id, code="PUN-W03", defaults={"name": "Hadapsar", "is_active": True})

        zone_a1 = _get_or_create(db, Zone, ward_id=ward_a.id, code="ZN-A1", defaults={"name": "Shivajinagar Core", "is_active": True})
        zone_a2 = _get_or_create(db, Zone, ward_id=ward_a.id, code="ZN-A2", defaults={"name": "Deccan Belt", "is_active": True})
        zone_b1 = _get_or_create(db, Zone, ward_id=ward_b.id, code="ZN-B1", defaults={"name": "Karve Nagar", "is_active": True})
        zone_b2 = _get_or_create(db, Zone, ward_id=ward_b.id, code="ZN-B2", defaults={"name": "Paud Road", "is_active": True})
        zone_c1 = _get_or_create(db, Zone, ward_id=ward_c.id, code="ZN-C1", defaults={"name": "Magarpatta", "is_active": True})
        zone_c2 = _get_or_create(db, Zone, ward_id=ward_c.id, code="ZN-C2", defaults={"name": "Mundhwa", "is_active": True})

        super_admin = _ensure_user(
            db,
            email="demo.superadmin@prakriti.ai",
            full_name="Aarav Kulkarni",
            role_code="SUPER_ADMIN",
            organization_id=org.id,
            city_id=city.id,
            ward_id=ward_a.id,
            zone_id=zone_a1.id,
            phone="+91-9876501001",
            is_superuser=True,
        )
        city_admin = _ensure_user(
            db,
            email="demo.cityadmin@prakriti.ai",
            full_name="Meera Joshi",
            role_code="CITY_ADMIN",
            organization_id=org.id,
            city_id=city.id,
            ward_id=ward_a.id,
            zone_id=zone_a2.id,
            phone="+91-9876501002",
        )
        ward_officer = _ensure_user(
            db,
            email="demo.wardofficer@prakriti.ai",
            full_name="Rohan Deshmukh",
            role_code="WARD_OFFICER",
            organization_id=org.id,
            city_id=city.id,
            ward_id=ward_b.id,
            zone_id=zone_b1.id,
            phone="+91-9876501003",
        )
        supervisor = _ensure_user(
            db,
            email="demo.supervisor@prakriti.ai",
            full_name="Priya More",
            role_code="SANITATION_SUPERVISOR",
            organization_id=org.id,
            city_id=city.id,
            ward_id=ward_b.id,
            zone_id=zone_b2.id,
            phone="+91-9876501004",
        )
        worker_user = _ensure_user(
            db,
            email="demo.worker@prakriti.ai",
            full_name="Sanjay Pawar",
            role_code="WORKER",
            organization_id=org.id,
            city_id=city.id,
            ward_id=ward_b.id,
            zone_id=zone_b2.id,
            phone="+91-9876501005",
        )
        processor_user = _ensure_user(
            db,
            email="demo.processor@prakriti.ai",
            full_name="Nisha Patil",
            role_code="PROCESSOR",
            organization_id=org.id,
            city_id=city.id,
            ward_id=ward_c.id,
            zone_id=zone_c1.id,
            phone="+91-9876501006",
        )
        auditor_user = _ensure_user(
            db,
            email="demo.auditor@prakriti.ai",
            full_name="Kabir Shah",
            role_code="AUDITOR",
            organization_id=org.id,
            city_id=city.id,
            ward_id=ward_a.id,
            zone_id=zone_a1.id,
            phone="+91-9876501007",
        )
        bulk_generator_user = _ensure_user(
            db,
            email="demo.bulkgen@prakriti.ai",
            full_name="Ananya Kulshrestha",
            role_code="BULK_GENERATOR",
            organization_id=org.id,
            city_id=city.id,
            ward_id=ward_c.id,
            zone_id=zone_c2.id,
            phone="+91-9876501008",
        )

        worker_profile = _get_or_create(
            db,
            WorkerProfile,
            employee_code="WRK-PUN-001",
            defaults={
                "user_id": worker_user.id,
                "city_id": city.id,
                "ward_id": ward_b.id,
                "zone_id": zone_b2.id,
                "designation": "Door-to-door Collection Worker",
                "employment_status": EmploymentStatus.ACTIVE,
                "joined_on": date(2022, 6, 15),
                "is_active": True,
            },
        )

        helper_worker_user = _ensure_user(
            db,
            email="demo.worker2@prakriti.ai",
            full_name="Rahul Bhosale",
            role_code="WORKER",
            organization_id=org.id,
            city_id=city.id,
            ward_id=ward_c.id,
            zone_id=zone_c1.id,
            phone="+91-9876501009",
        )
        helper_worker_profile = _get_or_create(
            db,
            WorkerProfile,
            employee_code="WRK-PUN-002",
            defaults={
                "user_id": helper_worker_user.id,
                "city_id": city.id,
                "ward_id": ward_c.id,
                "zone_id": zone_c1.id,
                "designation": "Collection Associate",
                "employment_status": EmploymentStatus.ACTIVE,
                "joined_on": date(2023, 2, 10),
                "is_active": True,
            },
        )

        vehicle_1 = _get_or_create(
            db,
            Vehicle,
            registration_number="MH12AB1234",
            defaults={
                "city_id": city.id,
                "ward_id": ward_b.id,
                "zone_id": zone_b2.id,
                "vehicle_type": VehicleType.AUTO_TIPPER,
                "capacity_kg": 950,
                "ownership_type": OwnershipType.MUNICIPAL,
                "is_active": True,
            },
        )
        vehicle_2 = _get_or_create(
            db,
            Vehicle,
            registration_number="MH12CD5678",
            defaults={
                "city_id": city.id,
                "ward_id": ward_c.id,
                "zone_id": zone_c1.id,
                "vehicle_type": VehicleType.COMPACTOR,
                "capacity_kg": 2800,
                "ownership_type": OwnershipType.CONTRACTOR,
                "is_active": True,
            },
        )

        addr_h1 = _get_or_create(
            db,
            Address,
            address_line_1="Flat 401, River Residency",
            postal_code="411004",
            defaults={
                "address_line_2": "Lane 3",
                "landmark": "Near Sambhaji Park",
                "area": "Deccan Gymkhana",
                "city_name": "Pune",
                "state": "Maharashtra",
                "country": "India",
                "latitude": Decimal("18.5189000"),
                "longitude": Decimal("73.8412000"),
                "is_active": True,
            },
        )
        addr_h2 = _get_or_create(
            db,
            Address,
            address_line_1="B-702, Mayur Heights",
            postal_code="411038",
            defaults={
                "area": "Kothrud",
                "city_name": "Pune",
                "state": "Maharashtra",
                "country": "India",
                "is_active": True,
            },
        )
        addr_h3 = _get_or_create(
            db,
            Address,
            address_line_1="Plot 16, Green Valley",
            postal_code="411028",
            defaults={
                "area": "Magarpatta",
                "city_name": "Pune",
                "state": "Maharashtra",
                "country": "India",
                "is_active": True,
            },
        )

        households: list[Household] = [
            _get_or_create(
                db,
                Household,
                household_code="HH-PUN-1001",
                defaults={
                    "organization_id": org.id,
                    "city_id": city.id,
                    "ward_id": ward_a.id,
                    "zone_id": zone_a1.id,
                    "address_id": addr_h1.id,
                    "household_head_name": "Vikram Naik",
                    "contact_phone": "+91-9922100011",
                    "contact_email": "vikram.naik@example.com",
                    "number_of_members": 4,
                    "dwelling_type": DwellingType.APARTMENT,
                    "onboarding_status": OnboardingStatus.COMPLETED,
                    "is_active": True,
                },
            ),
            _get_or_create(
                db,
                Household,
                household_code="HH-PUN-1002",
                defaults={
                    "organization_id": org.id,
                    "city_id": city.id,
                    "ward_id": ward_b.id,
                    "zone_id": zone_b1.id,
                    "address_id": addr_h2.id,
                    "household_head_name": "Madhuri Kale",
                    "contact_phone": "+91-9922100012",
                    "number_of_members": 5,
                    "dwelling_type": DwellingType.GATED_COMMUNITY,
                    "onboarding_status": OnboardingStatus.COMPLETED,
                    "is_active": True,
                },
            ),
            _get_or_create(
                db,
                Household,
                household_code="HH-PUN-1003",
                defaults={
                    "organization_id": org.id,
                    "city_id": city.id,
                    "ward_id": ward_c.id,
                    "zone_id": zone_c1.id,
                    "address_id": addr_h3.id,
                    "household_head_name": "Ritesh Wagh",
                    "contact_phone": "+91-9922100013",
                    "number_of_members": 3,
                    "dwelling_type": DwellingType.INDEPENDENT_HOUSE,
                    "onboarding_status": OnboardingStatus.IN_PROGRESS,
                    "is_active": True,
                },
            ),
        ]

        addr_g1 = _get_or_create(
            db,
            Address,
            address_line_1="Sunrise Grand Hotel",
            postal_code="411001",
            defaults={"area": "Camp", "city_name": "Pune", "state": "Maharashtra", "country": "India", "is_active": True},
        )
        addr_g2 = _get_or_create(
            db,
            Address,
            address_line_1="Apex Multispeciality Hospital",
            postal_code="411030",
            defaults={"area": "Sadashiv Peth", "city_name": "Pune", "state": "Maharashtra", "country": "India", "is_active": True},
        )

        generators: list[BulkWasteGenerator] = [
            _get_or_create(
                db,
                BulkWasteGenerator,
                generator_code="BG-PUN-5001",
                defaults={
                    "organization_id": org.id,
                    "city_id": city.id,
                    "ward_id": ward_a.id,
                    "zone_id": zone_a2.id,
                    "address_id": addr_g1.id,
                    "entity_name": "Sunrise Grand Hotel",
                    "contact_person_name": "Manoj Taware",
                    "contact_phone": "+91-9933300001",
                    "contact_email": "ops@sunrisegrand.in",
                    "generator_type": GeneratorType.HOTEL,
                    "estimated_daily_waste_kg": 420,
                    "compliance_status": ComplianceStatus.COMPLIANT,
                    "onboarding_status": OnboardingStatus.COMPLETED,
                    "is_active": True,
                },
            ),
            _get_or_create(
                db,
                BulkWasteGenerator,
                generator_code="BG-PUN-5002",
                defaults={
                    "organization_id": org.id,
                    "city_id": city.id,
                    "ward_id": ward_b.id,
                    "zone_id": zone_b2.id,
                    "address_id": addr_g2.id,
                    "entity_name": "Apex Multispeciality Hospital",
                    "contact_person_name": "Dr. Neha Bendre",
                    "contact_phone": "+91-9933300002",
                    "contact_email": "facility@apexhospital.in",
                    "generator_type": GeneratorType.HOSPITAL,
                    "estimated_daily_waste_kg": 510,
                    "compliance_status": ComplianceStatus.UNDER_REVIEW,
                    "onboarding_status": OnboardingStatus.COMPLETED,
                    "is_active": True,
                },
            ),
            _get_or_create(
                db,
                BulkWasteGenerator,
                generator_code="BG-PUN-5003",
                defaults={
                    "organization_id": org.id,
                    "city_id": city.id,
                    "ward_id": ward_c.id,
                    "zone_id": zone_c2.id,
                    "entity_name": "Magarpatta IT Office Park",
                    "contact_person_name": "Shweta Pathak",
                    "contact_phone": "+91-9933300003",
                    "generator_type": GeneratorType.COMMERCIAL_COMPLEX,
                    "estimated_daily_waste_kg": 640,
                    "compliance_status": ComplianceStatus.COMPLIANT,
                    "onboarding_status": OnboardingStatus.COMPLETED,
                    "is_active": True,
                },
            ),
            _get_or_create(
                db,
                BulkWasteGenerator,
                generator_code="BG-PUN-5004",
                defaults={
                    "organization_id": org.id,
                    "city_id": city.id,
                    "ward_id": ward_c.id,
                    "zone_id": zone_c1.id,
                    "entity_name": "Riverfront Mall",
                    "contact_person_name": "Amit More",
                    "contact_phone": "+91-9933300004",
                    "generator_type": GeneratorType.MARKET,
                    "estimated_daily_waste_kg": 730,
                    "compliance_status": ComplianceStatus.UNDER_REVIEW,
                    "onboarding_status": OnboardingStatus.IN_PROGRESS,
                    "is_active": True,
                },
            ),
            _get_or_create(
                db,
                BulkWasteGenerator,
                generator_code="BG-PUN-5005",
                defaults={
                    "organization_id": org.id,
                    "city_id": city.id,
                    "ward_id": ward_b.id,
                    "zone_id": zone_b1.id,
                    "entity_name": "Green Meadows Housing Society",
                    "contact_person_name": "Sachin Bapat",
                    "contact_phone": "+91-9933300005",
                    "generator_type": GeneratorType.INSTITUTION,
                    "estimated_daily_waste_kg": 255,
                    "compliance_status": ComplianceStatus.NON_COMPLIANT,
                    "onboarding_status": OnboardingStatus.IN_PROGRESS,
                    "is_active": True,
                },
            ),
        ]

        facility_compost = _get_or_create(
            db,
            ProcessingFacility,
            facility_code="FAC-PUN-COMP-01",
            defaults={
                "city_id": city.id,
                "ward_id": ward_c.id,
                "zone_id": zone_c1.id,
                "name": "Pune Bio-Compost Center",
                "facility_type": FacilityType.COMPOST_PLANT,
                "operator_name": "Pune Municipal Corp",
                "capacity_kg_per_day": 12000,
                "is_active": True,
            },
        )
        facility_mrf = _get_or_create(
            db,
            ProcessingFacility,
            facility_code="FAC-PUN-MRF-01",
            defaults={
                "city_id": city.id,
                "ward_id": ward_b.id,
                "zone_id": zone_b2.id,
                "name": "Kothrud MRF",
                "facility_type": FacilityType.MRF,
                "operator_name": "EcoSort Pvt Ltd",
                "capacity_kg_per_day": 9000,
                "is_active": True,
            },
        )
        facility_landfill = _get_or_create(
            db,
            ProcessingFacility,
            facility_code="FAC-PUN-LAND-01",
            defaults={
                "city_id": city.id,
                "ward_id": ward_c.id,
                "zone_id": zone_c2.id,
                "name": "Uruli Landfill",
                "facility_type": FacilityType.LANDFILL,
                "operator_name": "PMC Landfill Ops",
                "capacity_kg_per_day": 24000,
                "is_active": True,
            },
        )
        facility_recycler = _get_or_create(
            db,
            ProcessingFacility,
            facility_code="FAC-PUN-RCY-01",
            defaults={
                "city_id": city.id,
                "ward_id": ward_a.id,
                "zone_id": zone_a2.id,
                "name": "Deccan Recycler Hub",
                "facility_type": FacilityType.OTHER,
                "operator_name": "Circular Loop Recyclers",
                "capacity_kg_per_day": 6500,
                "is_active": True,
            },
        )

        route_1 = _get_or_create(
            db,
            Route,
            route_code="RTE-PUN-WB-01",
            defaults={
                "city_id": city.id,
                "ward_id": ward_b.id,
                "zone_id": zone_b2.id,
                "name": "Kothrud Morning Route",
                "route_type": RouteType.DOOR_TO_DOOR,
                "is_active": True,
            },
        )
        route_2 = _get_or_create(
            db,
            Route,
            route_code="RTE-PUN-WC-02",
            defaults={
                "city_id": city.id,
                "ward_id": ward_c.id,
                "zone_id": zone_c1.id,
                "name": "Hadapsar Bulk Route",
                "route_type": RouteType.BULK_COLLECTION,
                "is_active": True,
            },
        )

        rs_1 = _get_or_create(
            db,
            RouteStop,
            route_id=route_1.id,
            stop_sequence=1,
            defaults={
                "source_type": OperationalSourceType.HOUSEHOLD,
                "household_id": households[1].id,
                "bulk_generator_id": None,
                "expected_time": time(7, 15),
                "is_active": True,
            },
        )
        rs_2 = _get_or_create(
            db,
            RouteStop,
            route_id=route_1.id,
            stop_sequence=2,
            defaults={
                "source_type": OperationalSourceType.HOUSEHOLD,
                "household_id": households[0].id,
                "bulk_generator_id": None,
                "expected_time": time(7, 40),
                "is_active": True,
            },
        )
        rs_3 = _get_or_create(
            db,
            RouteStop,
            route_id=route_2.id,
            stop_sequence=1,
            defaults={
                "source_type": OperationalSourceType.BULK_GENERATOR,
                "household_id": None,
                "bulk_generator_id": generators[0].id,
                "expected_time": time(8, 20),
                "is_active": True,
            },
        )
        rs_4 = _get_or_create(
            db,
            RouteStop,
            route_id=route_2.id,
            stop_sequence=2,
            defaults={
                "source_type": OperationalSourceType.BULK_GENERATOR,
                "household_id": None,
                "bulk_generator_id": generators[1].id,
                "expected_time": time(9, 5),
                "is_active": True,
            },
        )

        today = date.today()
        shift_am = _ensure_shift(
            db,
            city_id=city.id,
            ward_id=ward_b.id,
            zone_id=zone_b2.id,
            supervisor_user_id=supervisor.id,
            name="Morning Shift",
            shift_date=today,
            start=time(6, 0),
            end=time(14, 0),
        )
        shift_pm = _ensure_shift(
            db,
            city_id=city.id,
            ward_id=ward_c.id,
            zone_id=zone_c1.id,
            supervisor_user_id=supervisor.id,
            name="Afternoon Shift",
            shift_date=today,
            start=time(14, 0),
            end=time(22, 0),
        )

        tasks: list[PickupTask] = [
            _ensure_pickup_task(
                db,
                marker="DEMO:PT-001",
                city_id=city.id,
                ward_id=ward_b.id,
                zone_id=zone_b2.id,
                route_id=route_1.id,
                route_stop_id=rs_1.id,
                shift_id=shift_am.id,
                source_type=OperationalSourceType.HOUSEHOLD,
                household_id=households[1].id,
                bulk_generator_id=None,
                assigned_worker_id=worker_profile.id,
                assigned_vehicle_id=vehicle_1.id,
                scheduled_date=today,
                status=PickupStatus.COMPLETED,
                expected_weight=22,
                actual_weight=21.3,
            ),
            _ensure_pickup_task(
                db,
                marker="DEMO:PT-002",
                city_id=city.id,
                ward_id=ward_b.id,
                zone_id=zone_b2.id,
                route_id=route_1.id,
                route_stop_id=rs_2.id,
                shift_id=shift_am.id,
                source_type=OperationalSourceType.HOUSEHOLD,
                household_id=households[0].id,
                bulk_generator_id=None,
                assigned_worker_id=worker_profile.id,
                assigned_vehicle_id=vehicle_1.id,
                scheduled_date=today,
                status=PickupStatus.IN_PROGRESS,
                expected_weight=18,
                actual_weight=None,
            ),
            _ensure_pickup_task(
                db,
                marker="DEMO:PT-003",
                city_id=city.id,
                ward_id=ward_c.id,
                zone_id=zone_c1.id,
                route_id=route_2.id,
                route_stop_id=rs_3.id,
                shift_id=shift_pm.id,
                source_type=OperationalSourceType.BULK_GENERATOR,
                household_id=None,
                bulk_generator_id=generators[0].id,
                assigned_worker_id=helper_worker_profile.id,
                assigned_vehicle_id=vehicle_2.id,
                scheduled_date=today,
                status=PickupStatus.COMPLETED,
                expected_weight=380,
                actual_weight=372,
            ),
            _ensure_pickup_task(
                db,
                marker="DEMO:PT-004",
                city_id=city.id,
                ward_id=ward_c.id,
                zone_id=zone_c1.id,
                route_id=route_2.id,
                route_stop_id=rs_4.id,
                shift_id=shift_pm.id,
                source_type=OperationalSourceType.BULK_GENERATOR,
                household_id=None,
                bulk_generator_id=generators[1].id,
                assigned_worker_id=helper_worker_profile.id,
                assigned_vehicle_id=vehicle_2.id,
                scheduled_date=today,
                status=PickupStatus.MISSED,
                expected_weight=300,
                actual_weight=None,
            ),
        ]

        for idx, task in enumerate(tasks, start=1):
            if task.pickup_status not in {PickupStatus.COMPLETED, PickupStatus.IN_PROGRESS}:
                continue
            marker = f"DEMO:LOG-{idx}"
            _get_or_create(
                db,
                PickupLog,
                pickup_task_id=task.id,
                event_type=PickupEventType.TASK_STARTED,
                notes=f"{marker}: task started",
                defaults={
                    "worker_profile_id": task.assigned_worker_id,
                    "latitude": Decimal("18.5204"),
                    "longitude": Decimal("73.8567"),
                    "weight_kg": None,
                },
            )
            if task.pickup_status == PickupStatus.COMPLETED:
                _get_or_create(
                    db,
                    PickupLog,
                    pickup_task_id=task.id,
                    event_type=PickupEventType.TASK_COMPLETED,
                    notes=f"{marker}: task completed",
                    defaults={
                        "worker_profile_id": task.assigned_worker_id,
                        "latitude": Decimal("18.5205"),
                        "longitude": Decimal("73.8568"),
                        "weight_kg": task.actual_weight_kg,
                    },
                )

        batch_1 = _get_or_create(
            db,
            CollectedBatch,
            batch_code="BATCH-PUN-2401",
            defaults={
                "city_id": city.id,
                "ward_id": ward_b.id,
                "zone_id": zone_b2.id,
                "assigned_vehicle_id": vehicle_1.id,
                "assigned_worker_id": worker_profile.id,
                "origin_route_id": route_1.id,
                "created_date": today,
                "source_type_summary": "HOUSEHOLD",
                "total_weight_kg": 1430,
                "batch_status": BatchStatus.PROCESSING,
                "notes": "Morning mixed household collection",
                "is_active": True,
            },
        )
        batch_2 = _get_or_create(
            db,
            CollectedBatch,
            batch_code="BATCH-PUN-2402",
            defaults={
                "city_id": city.id,
                "ward_id": ward_c.id,
                "zone_id": zone_c1.id,
                "assigned_vehicle_id": vehicle_2.id,
                "assigned_worker_id": helper_worker_profile.id,
                "origin_route_id": route_2.id,
                "created_date": today,
                "source_type_summary": "BULK_GENERATOR",
                "total_weight_kg": 2140,
                "batch_status": BatchStatus.RECEIVED,
                "notes": "Bulk commercial collection",
                "is_active": True,
            },
        )

        transfer_1 = _get_or_create(
            db,
            TransferRecord,
            manifest_number="MAN-PUN-1001",
            defaults={
                "batch_id": batch_1.id,
                "from_entity_type": TransferEntityType.ROUTE,
                "from_entity_id": route_1.id,
                "to_facility_id": facility_mrf.id,
                "dispatched_at": datetime.now(UTC).replace(tzinfo=None) - timedelta(hours=7),
                "dispatched_weight_kg": 1430,
                "received_weight_kg": 1390,
                "received_at": datetime.now(UTC).replace(tzinfo=None) - timedelta(hours=5),
                "transfer_status": TransferStatus.RECEIVED,
                "notes": "Transfer completed with minor moisture loss",
            },
        )
        transfer_2 = _get_or_create(
            db,
            TransferRecord,
            manifest_number="MAN-PUN-1002",
            defaults={
                "batch_id": batch_2.id,
                "from_entity_type": TransferEntityType.ROUTE,
                "from_entity_id": route_2.id,
                "to_facility_id": facility_compost.id,
                "dispatched_at": datetime.now(UTC).replace(tzinfo=None) - timedelta(hours=4),
                "dispatched_weight_kg": 2140,
                "transfer_status": TransferStatus.IN_TRANSIT,
                "notes": "Vehicle expected at facility by evening",
            },
        )

        _get_or_create(
            db,
            FacilityReceipt,
            transfer_record_id=transfer_1.id,
            defaults={
                "facility_id": facility_mrf.id,
                "received_by_user_id": processor_user.id,
                "received_at": datetime.now(UTC).replace(tzinfo=None) - timedelta(hours=5),
                "gross_weight_kg": 1452,
                "net_weight_kg": 1390,
                "verification_status": VerificationStatus.VERIFIED,
                "notes": "Receipt validated by weighbridge",
            },
        )

        processing_1 = _get_or_create(
            db,
            ProcessingRecord,
            batch_id=batch_1.id,
            process_type=ProcessType.SEGREGATION,
            processed_at=datetime.now(UTC).replace(tzinfo=None) - timedelta(hours=3),
            defaults={
                "facility_id": facility_mrf.id,
                "input_weight_kg": 1390,
                "output_recovered_kg": 812,
                "output_rejected_kg": 171,
                "residue_to_landfill_kg": 407,
                "recyclable_plastic_kg": 248,
                "recyclable_metal_kg": 114,
                "recyclable_paper_kg": 305,
                "recyclable_glass_kg": 145,
                "processing_status": ProcessingStatus.COMPLETED,
                "notes": "Dry line processed with 58% recovery",
            },
        )

        landfill_1 = _get_or_create(
            db,
            LandfillRecord,
            batch_id=batch_1.id,
            disposal_date=today,
            defaults={
                "facility_id": facility_landfill.id,
                "transported_by_vehicle_id": vehicle_2.id,
                "waste_weight_kg": 407,
                "disposal_method": DisposalMethod.LANDFILL,
                "landfill_cell": "CELL-3A",
                "notes": "Residual rejects from MRF",
            },
        )

        cert_1 = _get_or_create(
            db,
            RecoveryCertificate,
            certificate_number="RC-PUN-9001",
            defaults={
                "facility_id": facility_mrf.id,
                "batch_id": batch_1.id,
                "bulk_generator_id": generators[0].id,
                "issued_by_user_id": auditor_user.id,
                "issue_date": today,
                "waste_type": WasteType.PLASTIC,
                "certified_weight_kg": 248,
                "recovery_method": RecoveryMethod.RECYCLING,
                "verification_status": VerificationStatus.VERIFIED,
                "notes": "Verified by auditor after invoice trace",
            },
        )

        factor_landfill = _get_or_create(
            db,
            EmissionFactor,
            factor_code="EF-LANDFILL-MIXED-2025",
            defaults={
                "factor_name": "Landfill mixed MSW default factor",
                "waste_type": WasteType.MIXED_MSW,
                "process_type": None,
                "factor_unit": "kgCO2e/kg",
                "factor_value": 0.62,
                "source_standard": "IPCC 2019 Refined",
                "geography": "India",
                "effective_from": date(2025, 1, 1),
                "methodology_reference": "Default municipal mixed waste factor",
                "is_active": True,
            },
        )
        factor_recovery = _get_or_create(
            db,
            EmissionFactor,
            factor_code="EF-RECOVERY-PLASTIC-2025",
            defaults={
                "factor_name": "Plastic recycling avoided emission",
                "waste_type": WasteType.PLASTIC,
                "process_type": ProcessType.RECYCLING,
                "factor_unit": "kgCO2e/kg",
                "factor_value": -1.9,
                "source_standard": "CPCB + internal methodology",
                "geography": "India",
                "effective_from": date(2025, 1, 1),
                "methodology_reference": "Avoided emission for recycled plastic",
                "is_active": True,
            },
        )

        carbon_project = _get_or_create(
            db,
            CarbonProject,
            project_code="CP-PUN-DIV-01",
            defaults={
                "city_id": city.id,
                "ward_id": ward_b.id,
                "name": "Pune Diversion and Recovery Program",
                "project_type": CarbonProjectType.CITY_WIDE_DIVERSION,
                "methodology_name": "Prakriti Urban Waste Baseline v1",
                "methodology_version": "1.0",
                "standard_body": "Internal + GHG Protocol",
                "start_date": date(2025, 1, 1),
                "status": CarbonProjectStatus.ACTIVE,
                "description": "City-wide diversion and recovery accounting project",
                "is_active": True,
            },
        )

        event_landfill = _get_or_create(
            db,
            CarbonEvent,
            event_code="CE-PUN-0001",
            defaults={
                "carbon_project_id": carbon_project.id,
                "source_entity_type": CarbonSourceEntityType.LANDFILL_RECORD,
                "source_entity_id": landfill_1.id,
                "batch_id": batch_1.id,
                "facility_id": facility_landfill.id,
                "landfill_record_id": landfill_1.id,
                "event_type": CarbonEventType.LANDFILL_EMISSION,
                "waste_type": WasteType.MIXED_MSW,
                "quantity_kg": 407,
                "factor_id": factor_landfill.id,
                "factor_value": 0.62,
                "gross_emission_kgco2e": 252.34,
                "avoided_emission_kgco2e": 0,
                "net_emission_kgco2e": 252.34,
                "event_date": today,
                "calculation_status": CarbonCalculationStatus.CALCULATED,
                "notes": "Residual landfill emissions from batch 2401",
            },
        )

        event_recovery = _get_or_create(
            db,
            CarbonEvent,
            event_code="CE-PUN-0002",
            defaults={
                "carbon_project_id": carbon_project.id,
                "source_entity_type": CarbonSourceEntityType.RECOVERY_CERTIFICATE,
                "source_entity_id": cert_1.id,
                "batch_id": batch_1.id,
                "facility_id": facility_mrf.id,
                "recovery_certificate_id": cert_1.id,
                "event_type": CarbonEventType.RECYCLING_AVOIDED,
                "waste_type": WasteType.PLASTIC,
                "quantity_kg": 248,
                "factor_id": factor_recovery.id,
                "factor_value": -1.9,
                "gross_emission_kgco2e": 0,
                "avoided_emission_kgco2e": 471.2,
                "net_emission_kgco2e": -471.2,
                "event_date": today,
                "calculation_status": CarbonCalculationStatus.CALCULATED,
                "notes": "Avoided emissions from certified plastic recycling",
            },
        )

        ledger_1 = _get_or_create(
            db,
            CarbonLedgerEntry,
            ledger_entry_code="LE-PUN-2401",
            defaults={
                "carbon_event_id": event_landfill.id,
                "entry_type": LedgerEntryType.EMISSION,
                "debit_credit_direction": DebitCreditDirection.DEBIT,
                "quantity_kgco2e": 252.34,
                "city_id": city.id,
                "ward_id": ward_b.id,
                "period_month": today.month,
                "period_year": today.year,
                "verification_status": VerificationStatus.PENDING,
                "remarks": "Landfill debit for residual stream",
            },
        )
        ledger_2 = _get_or_create(
            db,
            CarbonLedgerEntry,
            ledger_entry_code="LE-PUN-2402",
            defaults={
                "carbon_event_id": event_recovery.id,
                "entry_type": LedgerEntryType.AVOIDED_EMISSION,
                "debit_credit_direction": DebitCreditDirection.CREDIT,
                "quantity_kgco2e": 471.2,
                "city_id": city.id,
                "ward_id": ward_b.id,
                "period_month": today.month,
                "period_year": today.year,
                "verification_status": VerificationStatus.VERIFIED,
                "remarks": "Recycling credit from certified material recovery",
            },
        )

        _get_or_create(
            db,
            CarbonVerification,
            ledger_entry_id=ledger_2.id,
            verification_status=VerificationStatus.VERIFIED,
            defaults={
                "carbon_event_id": event_recovery.id,
                "verified_by_user_id": auditor_user.id,
                "verified_at": datetime.now(UTC).replace(tzinfo=None),
                "comments": "Invoice and transport evidence validated",
            },
        )

        for ward in [ward_a, ward_b, ward_c]:
            _get_or_create(
                db,
                EnvironmentalSummary,
                city_id=city.id,
                ward_id=ward.id,
                reporting_month=today.month,
                reporting_year=today.year,
                defaults={
                    "total_collected_kg": 12000 + (1000 if ward == ward_b else 0),
                    "total_processed_kg": 9200,
                    "total_recycled_kg": 3600,
                    "total_composted_kg": 2800,
                    "total_landfilled_kg": 3200,
                    "landfill_diversion_percent": 73.3,
                    "gross_emission_kgco2e": 512.4,
                    "avoided_emission_kgco2e": 781.9,
                    "net_emission_kgco2e": -269.5,
                    "summary_status": SummaryStatus.GENERATED,
                },
            )

        db.commit()

        accounts = [
            "demo.superadmin@prakriti.ai",
            "demo.cityadmin@prakriti.ai",
            "demo.wardofficer@prakriti.ai",
            "demo.supervisor@prakriti.ai",
            "demo.worker@prakriti.ai",
            "demo.processor@prakriti.ai",
            "demo.auditor@prakriti.ai",
            "demo.bulkgen@prakriti.ai",
        ]

        return DemoSeedSummary(
            organization_slug=org.slug,
            city_name=city.name,
            account_emails=accounts,
            password_hint=DEMO_PASSWORD,
        )


if __name__ == "__main__":
    summary = run_demo_seed()
    print("Demo data seed complete")
    print(f"Organization: {summary.organization_slug}")
    print(f"City: {summary.city_name}")
    print("Accounts:")
    for email in summary.account_emails:
        print(f"  - {email}")
    print(f"Password: {summary.password_hint}")
