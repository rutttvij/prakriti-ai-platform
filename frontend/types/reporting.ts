import type { Uuid } from "@/types/api";

export interface DashboardMetricBundle {
  total_households: number;
  total_bulk_generators: number;
  total_active_workers: number;
  total_pickup_tasks: number;
  completed_pickups: number;
  missed_pickups: number;
  total_collected_weight_kg: number;
  total_processed_weight_kg: number;
  total_landfilled_weight_kg: number;
  landfill_diversion_percent: number;
  avoided_emissions_kgco2e: number;
  net_emissions_kgco2e: number;
}

export interface CityOverviewResponse {
  city_id: Uuid;
  date_from: string | null;
  date_to: string | null;
  metrics: DashboardMetricBundle;
}

export interface WardComparisonRow {
  ward_id: Uuid;
  ward_name: string;
  metrics: DashboardMetricBundle;
}

export interface WardOverviewResponse {
  city_id: Uuid;
  ward_id: Uuid;
  date_from: string | null;
  date_to: string | null;
  metrics: DashboardMetricBundle;
}

export interface CityWardComparisonResponse {
  city_id: Uuid;
  date_from: string | null;
  date_to: string | null;
  city_summary: DashboardMetricBundle;
  wards: WardComparisonRow[];
}

export interface ReportPageMeta {
  total_count: number;
  limit: number;
  offset: number;
  applied_filters: Record<string, string | number | boolean | null>;
}

export interface PickupReportRow {
  id: Uuid;
  city_id: Uuid;
  ward_id: Uuid;
  zone_id: Uuid | null;
  route_id: Uuid | null;
  assigned_worker_id: Uuid | null;
  source_type: string;
  household_id: Uuid | null;
  bulk_generator_id: Uuid | null;
  scheduled_date: string;
  pickup_status: string;
  actual_weight_kg: number | null;
  contamination_flag: boolean;
}

export interface PickupReportPage {
  meta: ReportPageMeta;
  summary: {
    total_tasks: number;
    completed_tasks: number;
    missed_tasks: number;
    total_actual_weight_kg: number;
  };
  rows: PickupReportRow[];
}

export interface WorkerReportPage {
  meta: ReportPageMeta;
  summary: {
    total_workers: number;
    active_workers: number;
    total_assigned_tasks: number;
    total_completed_tasks: number;
    total_completed_weight_kg: number;
  };
  rows: Array<{
    worker_id: Uuid;
    user_id: Uuid;
    full_name: string;
    employee_code: string;
    city_id: Uuid;
    ward_id: Uuid | null;
    zone_id: Uuid | null;
    employment_status: string;
    is_active: boolean;
    assigned_tasks: number;
    completed_tasks: number;
    missed_tasks: number;
    completed_weight_kg: number;
  }>;
}

export interface RouteReportPage {
  meta: ReportPageMeta;
  summary: {
    total_routes: number;
    total_tasks: number;
    total_completed_tasks: number;
    total_completed_weight_kg: number;
  };
  rows: Array<{
    route_id: Uuid;
    route_code: string;
    route_name: string;
    city_id: Uuid;
    ward_id: Uuid;
    zone_id: Uuid | null;
    total_stops: number;
    total_tasks: number;
    completed_tasks: number;
    missed_tasks: number;
    completed_weight_kg: number;
  }>;
}

export interface FacilityReportPage {
  meta: ReportPageMeta;
  summary: {
    total_facilities: number;
    total_transfers: number;
    total_processed_weight_kg: number;
    total_landfilled_weight_kg: number;
    total_certificates: number;
  };
  rows: Array<{
    facility_id: Uuid;
    facility_code: string;
    name: string;
    city_id: Uuid;
    ward_id: Uuid | null;
    zone_id: Uuid | null;
    is_active: boolean;
    total_transfers: number;
    total_processed_weight_kg: number;
    total_landfilled_weight_kg: number;
    total_certificates: number;
    certified_weight_kg: number;
  }>;
}

export interface TransferReportPage {
  meta: ReportPageMeta;
  summary: {
    total_transfers: number;
    received_transfers: number;
    total_dispatched_weight_kg: number;
    total_received_weight_kg: number;
  };
  rows: Array<{
    transfer_id: Uuid;
    batch_id: Uuid;
    to_facility_id: Uuid;
    city_id: Uuid;
    ward_id: Uuid;
    transfer_status: string;
    dispatched_at: string;
    received_at: string | null;
    dispatched_weight_kg: number;
    received_weight_kg: number | null;
  }>;
}

export interface BulkGeneratorReportPage {
  meta: ReportPageMeta;
  summary: {
    total_generators: number;
    compliant_generators: number;
    non_compliant_generators: number;
    total_pickups: number;
    total_certificates: number;
    total_certified_weight_kg: number;
  };
  rows: Array<{
    generator_id: Uuid;
    generator_code: string;
    entity_name: string;
    city_id: Uuid;
    ward_id: Uuid;
    zone_id: Uuid | null;
    generator_type: string;
    compliance_status: string;
    onboarding_status: string;
    is_active: boolean;
    total_pickups: number;
    completed_pickups: number;
    missed_pickups: number;
    total_picked_weight_kg: number;
    total_certificates: number;
    certified_weight_kg: number;
  }>;
}

export interface EnvironmentalSummaryReportPage {
  meta: ReportPageMeta;
  summary: {
    total_summaries: number;
    collected_kg: number;
    processed_kg: number;
    landfilled_kg: number;
    avoided_emission_kgco2e: number;
    net_emission_kgco2e: number;
  };
  rows: Array<{
    summary_id: Uuid;
    city_id: Uuid;
    ward_id: Uuid | null;
    reporting_month: number;
    reporting_year: number;
    summary_status: string;
    total_collected_kg: number | null;
    total_processed_kg: number | null;
    total_landfilled_kg: number | null;
    landfill_diversion_percent: number | null;
    avoided_emission_kgco2e: number | null;
    net_emission_kgco2e: number | null;
    generated_at: string;
  }>;
}

export interface CarbonLedgerReportPage {
  meta: ReportPageMeta;
  summary: {
    total_entries: number;
    verified_entries: number;
    rejected_entries: number;
    total_quantity_kgco2e: number;
  };
  rows: Array<{
    entry_id: Uuid;
    carbon_event_id: Uuid;
    city_id: Uuid | null;
    ward_id: Uuid | null;
    entry_type: string;
    verification_status: string;
    period_month: number | null;
    period_year: number | null;
    quantity_kgco2e: number;
    recorded_at: string;
  }>;
}
