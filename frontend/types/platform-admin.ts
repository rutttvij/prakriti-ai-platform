import type { Uuid } from "@/types/api";

export interface PlatformMetricBundle {
  total_tenants: number;
  total_cities_onboarded: number;
  active_users: number;
  active_workers: number;
  total_pickup_tasks: number;
}

export interface PlatformAuditLogRecord {
  id: string;
  occurred_at: string;
  action: string;
  entity_type: string;
  entity_id: Uuid;
  entity_label: string;
  tenant_id: Uuid | null;
  city_id: Uuid | null;
  actor_user_id: Uuid | null;
  actor_name: string | null;
  details: string | null;
}

export interface OnboardingActionRecord {
  id: string;
  step: string;
  entity_type: string;
  entity_id: Uuid;
  entity_label: string;
  tenant_id: Uuid | null;
  city_id: Uuid | null;
  created_at: string;
  actor_user_id: Uuid | null;
  actor_name: string | null;
}

export interface HealthServiceStatus {
  service: string;
  status: string;
  detail: string | null;
  checked_at: string;
}

export interface SystemHealthResponse {
  overall_status: string;
  services: HealthServiceStatus[];
  environment: string;
  project_name: string;
  deployment_meta: Record<string, string>;
}

export interface PlatformSubscriptionPlanLimit {
  users: number;
  workers: number;
  cities: number;
  storage_gb: number;
  exports_per_month: number;
}

export interface PlatformSubscriptionItem {
  id: string;
  tenant_id: Uuid;
  tenant_name: string;
  plan_name: string;
  billing_status: string;
  renewal_status: string;
  feature_entitlements: string[];
  limits: PlatformSubscriptionPlanLimit;
  is_placeholder: boolean;
}

export interface PlatformFeatureFlagItem {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  tenant_visibility: string;
  environment_scope: string;
  is_mutable: boolean;
}

export interface TenantSummary {
  id: Uuid;
  name: string;
  slug: string;
  type: string;
  is_active: boolean;
  linked_city_count: number;
  linked_admin_count: number;
  linked_user_count: number;
  linked_worker_count: number;
  last_activity_at: string | null;
}

export interface TenantAdminUser {
  id: Uuid;
  full_name: string;
  email: string;
  role_codes: string[];
  is_active: boolean;
}

export interface TenantCityInfo {
  id: Uuid;
  name: string;
  state: string;
  country: string;
  is_active: boolean;
}

export interface TenantDetail {
  summary: TenantSummary;
  cities: TenantCityInfo[];
  admins: TenantAdminUser[];
  activity_summary: Record<string, number>;
  configuration_metadata: Record<string, string>;
}

export interface PlatformDashboardResponse {
  metrics: PlatformMetricBundle;
  recent_audit_activity: PlatformAuditLogRecord[];
  latest_onboarding_actions: OnboardingActionRecord[];
  system_health_summary: SystemHealthResponse;
  subscription_overview: Record<string, string | number | boolean>;
}

export interface PlatformAuditLogFilters {
  actor_user_id?: string;
  entity_type?: string;
  action?: string;
  tenant_id?: string;
  city_id?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
  [key: string]: string | number | boolean | undefined;
}
