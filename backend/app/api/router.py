from fastapi import APIRouter

from app.api.routes.addresses import router as address_router
from app.api.routes.auth import router as auth_router
from app.api.routes.audit_exports import router as audit_export_router
from app.api.routes.batches import router as batch_router
from app.api.routes.bulk_generators import router as bulk_generator_router
from app.api.routes.carbon_events import router as carbon_event_router
from app.api.routes.carbon_ledger import router as carbon_ledger_router
from app.api.routes.cities import router as city_router
from app.api.routes.carbon_projects import router as carbon_project_router
from app.api.routes.carbon_verifications import router as carbon_verification_router
from app.api.routes.dashboard import router as dashboard_router
from app.api.routes.emission_factors import router as emission_factor_router
from app.api.routes.environmental_summaries import router as environmental_summary_router
from app.api.routes.exports import router as export_router
from app.api.routes.facilities import router as facility_router
from app.api.routes.facility_receipts import router as facility_receipt_router
from app.api.routes.health import router as health_router
from app.api.routes.households import router as household_router
from app.api.routes.landfill_records import router as landfill_record_router
from app.api.routes.organizations import router as organization_router
from app.api.routes.pickup_logs import router as pickup_log_router
from app.api.routes.pickup_tasks import router as pickup_task_router
from app.api.routes.processing_records import router as processing_record_router
from app.api.routes.platform_admin import router as platform_admin_router
from app.api.routes.qr_tags import router as qr_tag_router
from app.api.routes.recovery_certificates import router as recovery_certificate_router
from app.api.routes.reports import router as reports_router
from app.api.routes.route_stops import router as route_stop_router
from app.api.routes.routes import router as route_router
from app.api.routes.shifts import router as shift_router
from app.api.routes.transfers import router as transfer_router
from app.api.routes.users import router as user_router
from app.api.routes.vehicles import router as vehicle_router
from app.api.routes.wards import router as ward_router
from app.api.routes.workers import router as worker_router
from app.api.routes.zones import router as zone_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(auth_router)
api_router.include_router(platform_admin_router)
api_router.include_router(dashboard_router)
api_router.include_router(reports_router)
api_router.include_router(audit_export_router)
api_router.include_router(export_router)
api_router.include_router(organization_router)
api_router.include_router(city_router)
api_router.include_router(ward_router)
api_router.include_router(zone_router)
api_router.include_router(user_router)
api_router.include_router(address_router)
api_router.include_router(qr_tag_router)
api_router.include_router(household_router)
api_router.include_router(bulk_generator_router)
api_router.include_router(facility_router)
api_router.include_router(batch_router)
api_router.include_router(transfer_router)
api_router.include_router(facility_receipt_router)
api_router.include_router(processing_record_router)
api_router.include_router(landfill_record_router)
api_router.include_router(recovery_certificate_router)
api_router.include_router(worker_router)
api_router.include_router(vehicle_router)
api_router.include_router(shift_router)
api_router.include_router(route_router)
api_router.include_router(route_stop_router)
api_router.include_router(pickup_task_router)
api_router.include_router(pickup_log_router)
api_router.include_router(emission_factor_router)
api_router.include_router(carbon_project_router)
api_router.include_router(carbon_event_router)
api_router.include_router(carbon_ledger_router)
api_router.include_router(carbon_verification_router)
api_router.include_router(environmental_summary_router)
