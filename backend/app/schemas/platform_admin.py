from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class PlatformMetricBundle(BaseModel):
    total_tenants: int = 0
    total_cities_onboarded: int = 0
    active_users: int = 0
    active_workers: int = 0
    total_pickup_tasks: int = 0


class PlatformAuditLogRecord(BaseModel):
    id: str
    occurred_at: datetime
    action: str
    entity_type: str
    entity_id: UUID
    entity_label: str
    tenant_id: UUID | None = None
    city_id: UUID | None = None
    actor_user_id: UUID | None = None
    actor_name: str | None = None
    details: str | None = None


class OnboardingActionRecord(BaseModel):
    id: str
    step: str
    entity_type: str
    entity_id: UUID
    entity_label: str
    tenant_id: UUID | None = None
    city_id: UUID | None = None
    created_at: datetime
    actor_user_id: UUID | None = None
    actor_name: str | None = None


class HealthServiceStatus(BaseModel):
    service: str
    status: str
    detail: str | None = None
    checked_at: datetime


class SystemHealthResponse(BaseModel):
    overall_status: str
    services: list[HealthServiceStatus]
    environment: str
    project_name: str
    deployment_meta: dict[str, str]


class PlatformSubscriptionPlanLimit(BaseModel):
    users: int
    workers: int
    cities: int
    storage_gb: int
    exports_per_month: int


class PlatformSubscriptionItem(BaseModel):
    id: str
    tenant_id: UUID
    tenant_name: str
    plan_name: str
    billing_status: str
    renewal_status: str
    feature_entitlements: list[str]
    limits: PlatformSubscriptionPlanLimit
    is_placeholder: bool = True


class PlatformFeatureFlagItem(BaseModel):
    key: str
    name: str
    description: str
    enabled: bool
    tenant_visibility: str
    environment_scope: str
    is_mutable: bool = False


class TenantSummary(BaseModel):
    id: UUID
    name: str
    slug: str
    type: str
    is_active: bool
    linked_city_count: int
    linked_admin_count: int
    linked_user_count: int
    linked_worker_count: int
    last_activity_at: datetime | None = None


class TenantAdminUser(BaseModel):
    id: UUID
    full_name: str
    email: str
    role_codes: list[str]
    is_active: bool


class TenantCityInfo(BaseModel):
    id: UUID
    name: str
    state: str
    country: str
    is_active: bool


class TenantDetail(BaseModel):
    summary: TenantSummary
    cities: list[TenantCityInfo]
    admins: list[TenantAdminUser]
    activity_summary: dict[str, int]
    configuration_metadata: dict[str, str]


class PlatformDashboardResponse(BaseModel):
    metrics: PlatformMetricBundle
    recent_audit_activity: list[PlatformAuditLogRecord]
    latest_onboarding_actions: list[OnboardingActionRecord]
    system_health_summary: SystemHealthResponse
    subscription_overview: dict[str, int | str | bool]
