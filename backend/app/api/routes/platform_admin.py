from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, literal, select, text
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.dependencies import require_roles
from app.db.session import get_db
from app.models.city import City
from app.models.organization import Organization
from app.models.pickup_task import PickupTask
from app.models.role import Role
from app.models.user import User
from app.models.user_role import UserRole
from app.models.ward import Ward
from app.models.worker_profile import WorkerProfile
from app.models.zone import Zone
from app.schemas.platform_admin import (
    HealthServiceStatus,
    OnboardingActionRecord,
    PlatformAuditLogRecord,
    PlatformDashboardResponse,
    PlatformFeatureFlagItem,
    PlatformMetricBundle,
    PlatformSubscriptionItem,
    PlatformSubscriptionPlanLimit,
    SystemHealthResponse,
    TenantAdminUser,
    TenantCityInfo,
    TenantDetail,
    TenantSummary,
)

router = APIRouter(prefix="/platform-admin", tags=["platform-admin"])

_ADMIN_ROLE_CODES = {"SUPER_ADMIN", "CITY_ADMIN", "WARD_OFFICER"}


def _iso_now() -> datetime:
    return datetime.now(UTC)


def _parse_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    parsed = datetime.fromisoformat(value)
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=UTC)
    return parsed


def _build_system_health(db: Session) -> SystemHealthResponse:
    settings = get_settings()
    checked_at = _iso_now()

    services: list[HealthServiceStatus] = [
        HealthServiceStatus(
            service="backend_api",
            status="healthy",
            detail="FastAPI service reachable",
            checked_at=checked_at,
        )
    ]

    auth_status = "healthy" if settings.secret_key else "degraded"
    services.append(
        HealthServiceStatus(
            service="auth_service",
            status=auth_status,
            detail="JWT configuration loaded" if auth_status == "healthy" else "Secret key missing",
            checked_at=checked_at,
        )
    )

    db_status = "healthy"
    db_detail = "Database ping succeeded"
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        db_status = "degraded"
        db_detail = "Database ping failed"

    services.append(
        HealthServiceStatus(
            service="database",
            status=db_status,
            detail=db_detail,
            checked_at=checked_at,
        )
    )

    overall_status = "healthy" if all(item.status == "healthy" for item in services) else "degraded"

    return SystemHealthResponse(
        overall_status=overall_status,
        services=services,
        environment=settings.environment,
        project_name=settings.project_name,
        deployment_meta={
            "environment": settings.environment,
            "project": settings.project_name,
            "database_driver": settings.database_url.split(":", maxsplit=1)[0],
        },
    )


def _tenant_counts(db: Session) -> tuple[dict[UUID, int], dict[UUID, int], dict[UUID, int], dict[UUID, int], dict[UUID, datetime]]:
    city_counts = {
        tenant_id: count
        for tenant_id, count in db.execute(select(City.organization_id, func.count(City.id)).group_by(City.organization_id)).all()
    }
    user_counts = {
        tenant_id: count
        for tenant_id, count in db.execute(
            select(User.organization_id, func.count(User.id)).where(User.organization_id.is_not(None)).group_by(User.organization_id)
        ).all()
    }
    admin_counts = {
        tenant_id: count
        for tenant_id, count in db.execute(
            select(User.organization_id, func.count(func.distinct(User.id)))
            .join(UserRole, UserRole.user_id == User.id)
            .join(Role, Role.id == UserRole.role_id)
            .where(User.organization_id.is_not(None), Role.code.in_(_ADMIN_ROLE_CODES), User.is_active.is_(True))
            .group_by(User.organization_id)
        ).all()
    }
    worker_counts = {
        tenant_id: count
        for tenant_id, count in db.execute(
            select(City.organization_id, func.count(WorkerProfile.id))
            .join(City, City.id == WorkerProfile.city_id)
            .group_by(City.organization_id)
        ).all()
    }

    city_last_activity = {
        tenant_id: last_updated
        for tenant_id, last_updated in db.execute(
            select(City.organization_id, func.max(City.updated_at)).group_by(City.organization_id)
        ).all()
    }
    user_last_activity = {
        tenant_id: last_updated
        for tenant_id, last_updated in db.execute(
            select(User.organization_id, func.max(User.updated_at)).where(User.organization_id.is_not(None)).group_by(User.organization_id)
        ).all()
    }

    tenant_last_activity: dict[UUID, datetime] = {}
    for tenant_id, last_updated in city_last_activity.items():
        tenant_last_activity[tenant_id] = last_updated
    for tenant_id, last_updated in user_last_activity.items():
        existing = tenant_last_activity.get(tenant_id)
        if existing is None or (last_updated and last_updated > existing):
            tenant_last_activity[tenant_id] = last_updated

    return city_counts, user_counts, admin_counts, worker_counts, tenant_last_activity


def _build_tenant_summary(org: Organization, counts: tuple[dict[UUID, int], dict[UUID, int], dict[UUID, int], dict[UUID, int], dict[UUID, datetime]]) -> TenantSummary:
    city_counts, user_counts, admin_counts, worker_counts, tenant_last_activity = counts
    return TenantSummary(
        id=org.id,
        name=org.name,
        slug=org.slug,
        type=org.type,
        is_active=org.is_active,
        linked_city_count=city_counts.get(org.id, 0),
        linked_admin_count=admin_counts.get(org.id, 0),
        linked_user_count=user_counts.get(org.id, 0),
        linked_worker_count=worker_counts.get(org.id, 0),
        last_activity_at=tenant_last_activity.get(org.id, org.updated_at),
    )


def _get_tenant_summaries(db: Session) -> list[TenantSummary]:
    organizations = db.execute(select(Organization).order_by(Organization.created_at.desc())).scalars().all()
    counts = _tenant_counts(db)
    return [_build_tenant_summary(org, counts) for org in organizations]


def _build_audit_logs(db: Session, max_per_entity: int = 80) -> list[PlatformAuditLogRecord]:
    city_to_tenant = {city_id: tenant_id for city_id, tenant_id in db.execute(select(City.id, City.organization_id)).all()}
    logs: list[PlatformAuditLogRecord] = []

    def add_event(
        *,
        action: str,
        entity_type: str,
        entity_id: UUID,
        entity_label: str,
        occurred_at: datetime,
        actor_user_id: UUID | None,
        tenant_id: UUID | None,
        city_id: UUID | None,
        details: str,
    ) -> None:
        logs.append(
            PlatformAuditLogRecord(
                id=f"{entity_type}:{entity_id}:{action}:{int(occurred_at.timestamp())}",
                occurred_at=occurred_at,
                action=action,
                entity_type=entity_type,
                entity_id=entity_id,
                entity_label=entity_label,
                tenant_id=tenant_id,
                city_id=city_id,
                actor_user_id=actor_user_id,
                details=details,
            )
        )

    organizations = db.execute(select(Organization).order_by(Organization.created_at.desc()).limit(max_per_entity)).scalars().all()
    for row in organizations:
        add_event(
            action="CREATED",
            entity_type="ORGANIZATION",
            entity_id=row.id,
            entity_label=row.name,
            occurred_at=row.created_at,
            actor_user_id=row.created_by,
            tenant_id=row.id,
            city_id=None,
            details="Organization record created",
        )

    cities = db.execute(select(City).order_by(City.created_at.desc()).limit(max_per_entity)).scalars().all()
    for row in cities:
        add_event(
            action="CREATED",
            entity_type="CITY",
            entity_id=row.id,
            entity_label=row.name,
            occurred_at=row.created_at,
            actor_user_id=row.created_by,
            tenant_id=row.organization_id,
            city_id=row.id,
            details="City onboarded",
        )

    users = db.execute(select(User).order_by(User.created_at.desc()).limit(max_per_entity)).scalars().all()
    for row in users:
        add_event(
            action="CREATED",
            entity_type="USER",
            entity_id=row.id,
            entity_label=row.full_name,
            occurred_at=row.created_at,
            actor_user_id=row.created_by,
            tenant_id=row.organization_id,
            city_id=row.city_id,
            details="User created",
        )

    pickup_tasks = db.execute(select(PickupTask).order_by(PickupTask.created_at.desc()).limit(max_per_entity)).scalars().all()
    for row in pickup_tasks:
        add_event(
            action="CREATED",
            entity_type="PICKUP_TASK",
            entity_id=row.id,
            entity_label=f"Pickup Task {row.id}",
            occurred_at=row.created_at,
            actor_user_id=row.created_by,
            tenant_id=city_to_tenant.get(row.city_id),
            city_id=row.city_id,
            details=f"Pickup task scheduled with status {row.pickup_status.value}",
        )
        if row.updated_at and row.updated_at > row.created_at:
            add_event(
                action="UPDATED",
                entity_type="PICKUP_TASK",
                entity_id=row.id,
                entity_label=f"Pickup Task {row.id}",
                occurred_at=row.updated_at,
                actor_user_id=row.updated_by,
                tenant_id=city_to_tenant.get(row.city_id),
                city_id=row.city_id,
                details=f"Pickup task updated to {row.pickup_status.value}",
            )

    actor_ids = {item.actor_user_id for item in logs if item.actor_user_id is not None}
    actors = {
        user.id: user.full_name
        for user in db.execute(select(User.id, User.full_name).where(User.id.in_(actor_ids))).all()
    } if actor_ids else {}

    for item in logs:
        if item.actor_user_id:
            item.actor_name = actors.get(item.actor_user_id)

    logs.sort(key=lambda item: item.occurred_at, reverse=True)
    return logs


def _latest_onboarding_actions(db: Session, limit: int = 20) -> list[OnboardingActionRecord]:
    records: list[OnboardingActionRecord] = []

    def add_records(step: str, entity_type: str, rows: list[tuple[UUID, str, UUID | None, UUID | None, datetime, UUID | None]]) -> None:
        for entity_id, label, tenant_id, city_id, created_at, actor_user_id in rows:
            records.append(
                OnboardingActionRecord(
                    id=f"{entity_type}:{entity_id}:{int(created_at.timestamp())}",
                    step=step,
                    entity_type=entity_type,
                    entity_id=entity_id,
                    entity_label=label,
                    tenant_id=tenant_id,
                    city_id=city_id,
                    created_at=created_at,
                    actor_user_id=actor_user_id,
                )
            )

    add_records(
        "organization_selection_or_creation",
        "ORGANIZATION",
        db.execute(
            select(
                Organization.id,
                Organization.name,
                Organization.id,
                literal(None),
                Organization.created_at,
                Organization.created_by,
            )
            .order_by(Organization.created_at.desc())
            .limit(limit)
        ).all(),
    )
    add_records(
        "city_creation",
        "CITY",
        db.execute(select(City.id, City.name, City.organization_id, City.id, City.created_at, City.created_by).order_by(City.created_at.desc()).limit(limit)).all(),
    )
    add_records(
        "ward_setup",
        "WARD",
        db.execute(select(Ward.id, Ward.name, City.organization_id, Ward.city_id, Ward.created_at, Ward.created_by).join(City, City.id == Ward.city_id).order_by(Ward.created_at.desc()).limit(limit)).all(),
    )
    add_records(
        "zone_setup",
        "ZONE",
        db.execute(select(Zone.id, Zone.name, City.organization_id, Ward.city_id, Zone.created_at, Zone.created_by).join(Ward, Ward.id == Zone.ward_id).join(City, City.id == Ward.city_id).order_by(Zone.created_at.desc()).limit(limit)).all(),
    )
    add_records(
        "admin_user_setup",
        "USER",
        db.execute(select(User.id, User.full_name, User.organization_id, User.city_id, User.created_at, User.created_by).order_by(User.created_at.desc()).limit(limit)).all(),
    )

    actor_ids = {item.actor_user_id for item in records if item.actor_user_id is not None}
    actors = {
        user.id: user.full_name
        for user in db.execute(select(User.id, User.full_name).where(User.id.in_(actor_ids))).all()
    } if actor_ids else {}

    for item in records:
        if item.actor_user_id:
            item.actor_name = actors.get(item.actor_user_id)

    records.sort(key=lambda item: item.created_at, reverse=True)
    return records[:limit]


def _build_subscription_items(tenants: list[TenantSummary]) -> list[PlatformSubscriptionItem]:
    plans = [
        (
            "Starter",
            PlatformSubscriptionPlanLimit(users=50, workers=150, cities=1, storage_gb=50, exports_per_month=100),
            ["operations", "worker-mobile", "audit-exports"],
        ),
        (
            "Growth",
            PlatformSubscriptionPlanLimit(users=200, workers=500, cities=5, storage_gb=200, exports_per_month=500),
            ["operations", "worker-mobile", "maps", "alerts", "audit-exports", "carbon-intelligence"],
        ),
        (
            "Enterprise",
            PlatformSubscriptionPlanLimit(users=2000, workers=5000, cities=50, storage_gb=1000, exports_per_month=5000),
            ["all-modules", "priority-support", "sso-ready", "advanced-audit"],
        ),
    ]

    items: list[PlatformSubscriptionItem] = []
    for index, tenant in enumerate(tenants):
        if tenant.linked_city_count >= 5 or tenant.linked_user_count >= 300:
            plan_name, limits, entitlements = plans[2]
        elif tenant.linked_city_count >= 2 or tenant.linked_user_count >= 75:
            plan_name, limits, entitlements = plans[1]
        else:
            plan_name, limits, entitlements = plans[0]

        items.append(
            PlatformSubscriptionItem(
                id=f"sub-{tenant.id}",
                tenant_id=tenant.id,
                tenant_name=tenant.name,
                plan_name=plan_name,
                billing_status="BILLING_PLACEHOLDER",
                renewal_status="RENEWAL_PLACEHOLDER",
                feature_entitlements=entitlements,
                limits=limits,
                is_placeholder=True,
            )
        )
    return items


@router.get("/tenants", response_model=list[TenantSummary])
def list_tenants_endpoint(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("SUPER_ADMIN")),
) -> list[TenantSummary]:
    organizations = db.execute(select(Organization).order_by(Organization.created_at.desc())).scalars().all()
    counts = _tenant_counts(db)
    return [_build_tenant_summary(org, counts) for org in organizations]


@router.get("/tenants/{tenant_id}", response_model=TenantDetail)
def get_tenant_detail_endpoint(
    tenant_id: UUID,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("SUPER_ADMIN")),
) -> TenantDetail:
    org = db.get(Organization, tenant_id)
    if not org:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant not found")

    counts = _tenant_counts(db)
    summary = _build_tenant_summary(org, counts)

    cities = db.execute(select(City).where(City.organization_id == tenant_id).order_by(City.name.asc())).scalars().all()
    city_items = [
        TenantCityInfo(id=city.id, name=city.name, state=city.state, country=city.country, is_active=city.is_active)
        for city in cities
    ]

    admin_rows = db.execute(
        select(User.id, User.full_name, User.email, User.is_active, Role.code)
        .join(UserRole, UserRole.user_id == User.id)
        .join(Role, Role.id == UserRole.role_id)
        .where(User.organization_id == tenant_id, Role.code.in_(_ADMIN_ROLE_CODES))
        .order_by(User.full_name.asc())
    ).all()

    admin_map: dict[UUID, TenantAdminUser] = {}
    for user_id, full_name, email, is_active, role_code in admin_rows:
        if user_id not in admin_map:
            admin_map[user_id] = TenantAdminUser(
                id=user_id,
                full_name=full_name,
                email=email,
                role_codes=[role_code],
                is_active=is_active,
            )
        elif role_code not in admin_map[user_id].role_codes:
            admin_map[user_id].role_codes.append(role_code)

    city_ids = [city.id for city in cities]
    ward_count = db.execute(select(func.count(Ward.id)).where(Ward.city_id.in_(city_ids))).scalar_one() if city_ids else 0
    zone_count = (
        db.execute(select(func.count(Zone.id)).join(Ward, Ward.id == Zone.ward_id).where(Ward.city_id.in_(city_ids))).scalar_one()
        if city_ids
        else 0
    )
    task_count = (
        db.execute(select(func.count(PickupTask.id)).where(PickupTask.city_id.in_(city_ids))).scalar_one() if city_ids else 0
    )

    return TenantDetail(
        summary=summary,
        cities=city_items,
        admins=list(admin_map.values()),
        activity_summary={
            "city_count": summary.linked_city_count,
            "ward_count": ward_count,
            "zone_count": zone_count,
            "user_count": summary.linked_user_count,
            "worker_count": summary.linked_worker_count,
            "pickup_task_count": task_count,
        },
        configuration_metadata={
            "tenant_slug": org.slug,
            "tenant_type": org.type,
            "is_active": str(org.is_active).lower(),
            "feature_policy": "default-role-policy",
            "billing_mode": "placeholder",
        },
    )


@router.get("/dashboard", response_model=PlatformDashboardResponse)
def platform_admin_dashboard_endpoint(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("SUPER_ADMIN")),
) -> PlatformDashboardResponse:
    metrics = PlatformMetricBundle(
        total_tenants=db.execute(select(func.count(Organization.id))).scalar_one(),
        total_cities_onboarded=db.execute(select(func.count(City.id))).scalar_one(),
        active_users=db.execute(select(func.count(User.id)).where(User.is_active.is_(True))).scalar_one(),
        active_workers=db.execute(select(func.count(WorkerProfile.id)).where(WorkerProfile.is_active.is_(True))).scalar_one(),
        total_pickup_tasks=db.execute(select(func.count(PickupTask.id))).scalar_one(),
    )

    tenants = _get_tenant_summaries(db)
    subscriptions = _build_subscription_items(tenants)

    return PlatformDashboardResponse(
        metrics=metrics,
        recent_audit_activity=_build_audit_logs(db, max_per_entity=40)[:12],
        latest_onboarding_actions=_latest_onboarding_actions(db, limit=10),
        system_health_summary=_build_system_health(db),
        subscription_overview={
            "billing_enabled": False,
            "total_subscriptions": len(subscriptions),
            "enterprise_like_tenants": len([item for item in subscriptions if item.plan_name == "Enterprise"]),
            "status": "Billing provider not yet integrated",
        },
    )


@router.get("/system-health", response_model=SystemHealthResponse)
def get_system_health_endpoint(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("SUPER_ADMIN")),
) -> SystemHealthResponse:
    return _build_system_health(db)


@router.get("/audit-logs", response_model=list[PlatformAuditLogRecord])
def get_audit_logs_endpoint(
    actor_user_id: UUID | None = None,
    entity_type: str | None = None,
    action: str | None = None,
    tenant_id: UUID | None = None,
    city_id: UUID | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("SUPER_ADMIN")),
) -> list[PlatformAuditLogRecord]:
    logs = _build_audit_logs(db)
    parsed_date_from = _parse_datetime(date_from)
    parsed_date_to = _parse_datetime(date_to)

    def matches(item: PlatformAuditLogRecord) -> bool:
        if actor_user_id and item.actor_user_id != actor_user_id:
            return False
        if entity_type and item.entity_type != entity_type:
            return False
        if action and item.action != action:
            return False
        if tenant_id and item.tenant_id != tenant_id:
            return False
        if city_id and item.city_id != city_id:
            return False
        if parsed_date_from and item.occurred_at < parsed_date_from:
            return False
        if parsed_date_to and item.occurred_at > parsed_date_to:
            return False
        return True

    return [item for item in logs if matches(item)][:limit]


@router.get("/subscriptions", response_model=list[PlatformSubscriptionItem])
def get_subscriptions_endpoint(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("SUPER_ADMIN")),
) -> list[PlatformSubscriptionItem]:
    return _build_subscription_items(_get_tenant_summaries(db))


@router.get("/feature-flags", response_model=list[PlatformFeatureFlagItem])
def get_feature_flags_endpoint(
    _: User = Depends(require_roles("SUPER_ADMIN")),
) -> list[PlatformFeatureFlagItem]:
    return [
        PlatformFeatureFlagItem(
            key="monitoring.v2_alert_triage",
            name="Alert Triage V2",
            description="Enhanced issue triage workflows in monitoring surfaces.",
            enabled=True,
            tenant_visibility="all-tenants",
            environment_scope="production",
            is_mutable=False,
        ),
        PlatformFeatureFlagItem(
            key="maps.advanced_layers",
            name="Advanced Map Layers",
            description="Additional route-density overlays for operations planning.",
            enabled=False,
            tenant_visibility="pilot-tenants",
            environment_scope="staging",
            is_mutable=False,
        ),
        PlatformFeatureFlagItem(
            key="audit.pdf_exports",
            name="PDF Export Pipeline",
            description="PDF export packaging for evidence bundles.",
            enabled=False,
            tenant_visibility="none",
            environment_scope="roadmap",
            is_mutable=False,
        ),
        PlatformFeatureFlagItem(
            key="carbon.third_party_verification",
            name="3rd Party Carbon Verification",
            description="External verifier handoff workflows for carbon events.",
            enabled=False,
            tenant_visibility="enterprise-tenants",
            environment_scope="staging",
            is_mutable=False,
        ),
    ]


@router.get("/demo-accounts")
def get_demo_accounts_endpoint(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("SUPER_ADMIN")),
) -> dict[str, object]:
    settings = get_settings()
    if settings.environment.lower() in {"production", "prod"}:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Demo account endpoint is unavailable")

    rows = db.execute(
        select(User.email, User.full_name, literal("role").label("kind"), Role.code)
        .join(UserRole, UserRole.user_id == User.id)
        .join(Role, Role.id == UserRole.role_id)
        .where(User.email.like("demo.%@prakriti.ai"))
        .order_by(User.email.asc(), Role.code.asc())
    ).all()

    accounts: dict[str, dict[str, object]] = {}
    for email, full_name, _, role_code in rows:
        if email not in accounts:
            accounts[email] = {"email": email, "full_name": full_name, "roles": []}
        if role_code not in accounts[email]["roles"]:
            accounts[email]["roles"].append(role_code)

    return {
        "environment": settings.environment,
        "hint": "Demo accounts are intended for local/staging demonstrations only.",
        "default_password": "Demo@1234",
        "accounts": list(accounts.values()),
    }
