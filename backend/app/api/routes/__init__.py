from app.api.routes.addresses import router as addresses_router
from app.api.routes.auth import router as auth_router
from app.api.routes.audit_exports import router as audit_exports_router
from app.api.routes.batches import router as batches_router
from app.api.routes.bulk_generators import router as bulk_generators_router
from app.api.routes.carbon_events import router as carbon_events_router
from app.api.routes.carbon_ledger import router as carbon_ledger_router
from app.api.routes.carbon_projects import router as carbon_projects_router
from app.api.routes.carbon_verifications import router as carbon_verifications_router
from app.api.routes.cities import router as cities_router
from app.api.routes.dashboard import router as dashboard_router
from app.api.routes.emission_factors import router as emission_factors_router
from app.api.routes.environmental_summaries import router as environmental_summaries_router
from app.api.routes.exports import router as exports_router
from app.api.routes.facilities import router as facilities_router
from app.api.routes.facility_receipts import router as facility_receipts_router
from app.api.routes.health import router as health_router
from app.api.routes.households import router as households_router
from app.api.routes.landfill_records import router as landfill_records_router
from app.api.routes.organizations import router as organizations_router
from app.api.routes.pickup_logs import router as pickup_logs_router
from app.api.routes.pickup_tasks import router as pickup_tasks_router
from app.api.routes.processing_records import router as processing_records_router
from app.api.routes.qr_tags import router as qr_tags_router
from app.api.routes.recovery_certificates import router as recovery_certificates_router
from app.api.routes.reports import router as reports_router
from app.api.routes.route_stops import router as route_stops_router
from app.api.routes.routes import router as routes_router
from app.api.routes.shifts import router as shifts_router
from app.api.routes.transfers import router as transfers_router
from app.api.routes.users import router as users_router
from app.api.routes.vehicles import router as vehicles_router
from app.api.routes.wards import router as wards_router
from app.api.routes.workers import router as workers_router
from app.api.routes.zones import router as zones_router

__all__ = [
    "addresses_router",
    "auth_router",
    "audit_exports_router",
    "batches_router",
    "bulk_generators_router",
    "carbon_events_router",
    "carbon_ledger_router",
    "carbon_projects_router",
    "carbon_verifications_router",
    "cities_router",
    "dashboard_router",
    "emission_factors_router",
    "environmental_summaries_router",
    "exports_router",
    "facilities_router",
    "facility_receipts_router",
    "health_router",
    "households_router",
    "landfill_records_router",
    "organizations_router",
    "pickup_logs_router",
    "pickup_tasks_router",
    "processing_records_router",
    "qr_tags_router",
    "recovery_certificates_router",
    "reports_router",
    "route_stops_router",
    "routes_router",
    "shifts_router",
    "transfers_router",
    "vehicles_router",
    "wards_router",
    "workers_router",
    "zones_router",
    "users_router",
]
