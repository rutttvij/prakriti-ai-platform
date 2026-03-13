import type { Uuid } from "@/types/api";
import type { User } from "@/types/auth";

export type YesNo = "true" | "false";

export interface Organization {
  id: Uuid;
  name: string;
  slug: string;
  type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateOrganizationInput {
  name: string;
  slug: string;
  type: string;
  is_active: boolean;
}

export interface City {
  id: Uuid;
  organization_id: Uuid;
  name: string;
  state: string;
  country: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCityInput {
  organization_id: Uuid;
  name: string;
  state: string;
  country: string;
  is_active: boolean;
}

export interface Ward {
  id: Uuid;
  city_id: Uuid;
  name: string;
  code: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateWardInput {
  city_id: Uuid;
  name: string;
  code: string;
  is_active: boolean;
}

export interface Zone {
  id: Uuid;
  ward_id: Uuid;
  name: string;
  code: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateZoneInput {
  ward_id: Uuid;
  name: string;
  code: string;
  is_active: boolean;
}

export interface Household {
  id: Uuid;
  organization_id: Uuid | null;
  city_id: Uuid;
  ward_id: Uuid;
  zone_id: Uuid | null;
  address_id: Uuid | null;
  qr_tag_id: Uuid | null;
  household_code: string;
  household_head_name: string;
  contact_phone: string | null;
  contact_email: string | null;
  number_of_members: number | null;
  dwelling_type: string | null;
  onboarding_status: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateHouseholdInput {
  organization_id?: Uuid | null;
  city_id: Uuid;
  ward_id: Uuid;
  zone_id?: Uuid | null;
  address_id?: Uuid | null;
  qr_tag_id?: Uuid | null;
  household_code: string;
  household_head_name: string;
  contact_phone?: string | null;
  contact_email?: string | null;
  number_of_members?: number | null;
  dwelling_type?: string | null;
  onboarding_status?: string;
  is_active: boolean;
}

export interface BulkGenerator {
  id: Uuid;
  organization_id: Uuid | null;
  city_id: Uuid;
  ward_id: Uuid;
  zone_id: Uuid | null;
  address_id: Uuid | null;
  qr_tag_id: Uuid | null;
  generator_code: string;
  entity_name: string;
  contact_person_name: string;
  contact_phone: string;
  contact_email: string | null;
  generator_type: string;
  estimated_daily_waste_kg: number | null;
  compliance_status: string;
  onboarding_status: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateBulkGeneratorInput {
  organization_id?: Uuid | null;
  city_id: Uuid;
  ward_id: Uuid;
  zone_id?: Uuid | null;
  address_id?: Uuid | null;
  qr_tag_id?: Uuid | null;
  generator_code: string;
  entity_name: string;
  contact_person_name: string;
  contact_phone: string;
  contact_email?: string | null;
  generator_type: string;
  estimated_daily_waste_kg?: number | null;
  compliance_status?: string;
  onboarding_status?: string;
  is_active: boolean;
}

export interface Worker {
  id: Uuid;
  user_id: Uuid;
  employee_code: string;
  city_id: Uuid;
  ward_id: Uuid | null;
  zone_id: Uuid | null;
  designation: string;
  employment_status: string;
  joined_on: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateWorkerInput {
  user_id: Uuid;
  employee_code: string;
  city_id: Uuid;
  ward_id?: Uuid | null;
  zone_id?: Uuid | null;
  designation: string;
  employment_status?: string;
  joined_on?: string | null;
  is_active: boolean;
}

export interface Vehicle {
  id: Uuid;
  city_id: Uuid;
  ward_id: Uuid | null;
  zone_id: Uuid | null;
  registration_number: string;
  vehicle_type: string;
  capacity_kg: number | null;
  ownership_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateVehicleInput {
  city_id: Uuid;
  ward_id?: Uuid | null;
  zone_id?: Uuid | null;
  registration_number: string;
  vehicle_type: string;
  capacity_kg?: number | null;
  ownership_type: string;
  is_active: boolean;
}

export interface Route {
  id: Uuid;
  city_id: Uuid;
  ward_id: Uuid;
  zone_id: Uuid | null;
  route_code: string;
  name: string;
  route_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateRouteInput {
  city_id: Uuid;
  ward_id: Uuid;
  zone_id?: Uuid | null;
  route_code: string;
  name: string;
  route_type: string;
  is_active: boolean;
}

export interface PickupTask {
  id: Uuid;
  city_id: Uuid;
  ward_id: Uuid;
  zone_id: Uuid | null;
  route_id: Uuid | null;
  route_stop_id: Uuid | null;
  shift_id: Uuid | null;
  assigned_worker_id: Uuid | null;
  assigned_vehicle_id: Uuid | null;
  source_type: string;
  household_id: Uuid | null;
  bulk_generator_id: Uuid | null;
  scheduled_date: string;
  scheduled_time_window_start: string | null;
  scheduled_time_window_end: string | null;
  actual_start_at: string | null;
  actual_completed_at: string | null;
  pickup_status: string;
  waste_category: string | null;
  expected_weight_kg: number | null;
  actual_weight_kg: number | null;
  contamination_flag: boolean;
  notes: string | null;
  proof_photo_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatePickupTaskInput {
  city_id: Uuid;
  ward_id: Uuid;
  zone_id?: Uuid | null;
  route_id?: Uuid | null;
  route_stop_id?: Uuid | null;
  shift_id?: Uuid | null;
  source_type: string;
  household_id?: Uuid | null;
  bulk_generator_id?: Uuid | null;
  assigned_worker_id?: Uuid | null;
  assigned_vehicle_id?: Uuid | null;
  scheduled_date: string;
  scheduled_time_window_start?: string | null;
  scheduled_time_window_end?: string | null;
  pickup_status?: string;
  waste_category?: string | null;
  expected_weight_kg?: number | null;
  actual_weight_kg?: number | null;
  contamination_flag?: boolean;
  notes?: string | null;
  proof_photo_url?: string | null;
  is_active: boolean;
}

export interface PickupTaskStartInput {
  latitude?: string | null;
  longitude?: string | null;
  notes?: string | null;
  photo_url?: string | null;
}

export interface PickupTaskCompleteInput {
  actual_weight_kg?: number | null;
  waste_category?: string | null;
  contamination_flag?: boolean | null;
  latitude?: string | null;
  longitude?: string | null;
  notes?: string | null;
  photo_url?: string | null;
}

export interface PickupTaskMissInput {
  latitude?: string | null;
  longitude?: string | null;
  notes: string;
  photo_url?: string | null;
}

export interface PickupTaskActionResponse {
  task: PickupTask;
  message: string;
}

export interface Facility {
  id: Uuid;
  city_id: Uuid;
  ward_id: Uuid | null;
  zone_id: Uuid | null;
  address_id: Uuid | null;
  facility_code: string;
  name: string;
  facility_type: string;
  operator_name: string | null;
  license_number: string | null;
  capacity_kg_per_day: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateFacilityInput {
  city_id: Uuid;
  ward_id?: Uuid | null;
  zone_id?: Uuid | null;
  address_id?: Uuid | null;
  facility_code: string;
  name: string;
  facility_type: string;
  operator_name?: string | null;
  license_number?: string | null;
  capacity_kg_per_day?: number | null;
  is_active: boolean;
}

export interface EnvironmentalSummary {
  id: Uuid;
  city_id: Uuid;
  ward_id: Uuid | null;
  reporting_month: number;
  reporting_year: number;
  total_collected_kg: number | null;
  total_processed_kg: number | null;
  total_recycled_kg: number | null;
  total_composted_kg: number | null;
  total_landfilled_kg: number | null;
  landfill_diversion_percent: number | null;
  gross_emission_kgco2e: number | null;
  avoided_emission_kgco2e: number | null;
  net_emission_kgco2e: number | null;
  summary_status: string;
  generated_at: string;
  created_at: string;
  updated_at: string;
}

export interface CarbonLedgerEntry {
  id: Uuid;
  ledger_entry_code: string;
  carbon_event_id: Uuid;
  entry_type: string;
  debit_credit_direction: string;
  quantity_kgco2e: number;
  city_id: Uuid | null;
  ward_id: Uuid | null;
  period_month: number | null;
  period_year: number | null;
  recorded_at: string;
  verification_status: string;
  remarks: string | null;
  created_at: string;
  updated_at: string;
}

export interface Shift {
  id: Uuid;
  city_id: Uuid;
  ward_id: Uuid | null;
  zone_id: Uuid | null;
  name: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  supervisor_user_id: Uuid | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateShiftInput {
  city_id: Uuid;
  ward_id?: Uuid | null;
  zone_id?: Uuid | null;
  name: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  supervisor_user_id?: Uuid | null;
  is_active: boolean;
}

export interface RouteStop {
  id: Uuid;
  route_id: Uuid;
  stop_sequence: number;
  source_type: string;
  household_id: Uuid | null;
  bulk_generator_id: Uuid | null;
  expected_time: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateRouteStopInput {
  route_id: Uuid;
  stop_sequence: number;
  source_type: string;
  household_id?: Uuid | null;
  bulk_generator_id?: Uuid | null;
  expected_time?: string | null;
  is_active: boolean;
}

export interface PickupLog {
  id: Uuid;
  pickup_task_id: Uuid;
  worker_profile_id: Uuid;
  event_type: string;
  latitude: string | null;
  longitude: string | null;
  event_at: string;
  notes: string | null;
  weight_kg: number | null;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePickupLogInput {
  pickup_task_id: Uuid;
  worker_profile_id: Uuid;
  event_type: string;
  latitude?: string | null;
  longitude?: string | null;
  event_at?: string | null;
  notes?: string | null;
  weight_kg?: number | null;
  photo_url?: string | null;
}

export interface Batch {
  id: Uuid;
  city_id: Uuid;
  ward_id: Uuid;
  zone_id: Uuid | null;
  batch_code: string;
  created_date: string;
  source_type_summary: string | null;
  total_weight_kg: number | null;
  batch_status: string;
  assigned_vehicle_id: Uuid | null;
  assigned_worker_id: Uuid | null;
  origin_route_id: Uuid | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateBatchInput {
  city_id: Uuid;
  ward_id: Uuid;
  zone_id?: Uuid | null;
  batch_code: string;
  created_date: string;
  source_type_summary?: string | null;
  total_weight_kg?: number | null;
  batch_status: string;
  assigned_vehicle_id?: Uuid | null;
  assigned_worker_id?: Uuid | null;
  origin_route_id?: Uuid | null;
  notes?: string | null;
  is_active: boolean;
}

export interface Transfer {
  id: Uuid;
  batch_id: Uuid;
  from_entity_type: string;
  from_entity_id: Uuid | null;
  to_facility_id: Uuid;
  dispatched_at: string;
  received_at: string | null;
  dispatched_weight_kg: number;
  received_weight_kg: number | null;
  transfer_status: string;
  manifest_number: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTransferInput {
  batch_id: Uuid;
  from_entity_type: string;
  from_entity_id?: Uuid | null;
  to_facility_id: Uuid;
  dispatched_at: string;
  dispatched_weight_kg: number;
  manifest_number?: string | null;
  notes?: string | null;
}

export interface ReceiveTransferInput {
  received_at?: string | null;
  received_weight_kg: number;
  notes?: string | null;
  create_receipt?: boolean;
  facility_received_by_user_id?: Uuid | null;
  gross_weight_kg?: number | null;
  net_weight_kg?: number | null;
  contamination_notes?: string | null;
  verification_status?: string;
  proof_document_url?: string | null;
}

export interface FacilityReceipt {
  id: Uuid;
  transfer_record_id: Uuid;
  facility_id: Uuid;
  received_by_user_id: Uuid | null;
  received_at: string;
  gross_weight_kg: number | null;
  net_weight_kg: number;
  contamination_notes: string | null;
  verification_status: string;
  proof_document_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateFacilityReceiptInput {
  transfer_record_id: Uuid;
  facility_id: Uuid;
  received_by_user_id?: Uuid | null;
  received_at: string;
  gross_weight_kg?: number | null;
  net_weight_kg: number;
  contamination_notes?: string | null;
  verification_status?: string;
  proof_document_url?: string | null;
  notes?: string | null;
}

export interface ProcessingRecord {
  id: Uuid;
  facility_id: Uuid;
  batch_id: Uuid;
  processed_at: string;
  process_type: string;
  input_weight_kg: number;
  output_recovered_kg: number | null;
  output_rejected_kg: number | null;
  residue_to_landfill_kg: number | null;
  organic_compost_kg: number | null;
  recyclable_plastic_kg: number | null;
  recyclable_metal_kg: number | null;
  recyclable_paper_kg: number | null;
  recyclable_glass_kg: number | null;
  energy_recovered_kwh: number | null;
  processing_status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateProcessingRecordInput {
  facility_id: Uuid;
  batch_id: Uuid;
  processed_at: string;
  process_type: string;
  input_weight_kg: number;
  output_recovered_kg?: number | null;
  output_rejected_kg?: number | null;
  residue_to_landfill_kg?: number | null;
  organic_compost_kg?: number | null;
  recyclable_plastic_kg?: number | null;
  recyclable_metal_kg?: number | null;
  recyclable_paper_kg?: number | null;
  recyclable_glass_kg?: number | null;
  energy_recovered_kwh?: number | null;
  processing_status: string;
  notes?: string | null;
}

export interface LandfillRecord {
  id: Uuid;
  facility_id: Uuid;
  batch_id: Uuid | null;
  disposal_date: string;
  waste_weight_kg: number;
  disposal_method: string;
  landfill_cell: string | null;
  transported_by_vehicle_id: Uuid | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateLandfillRecordInput {
  facility_id: Uuid;
  batch_id?: Uuid | null;
  disposal_date: string;
  waste_weight_kg: number;
  disposal_method: string;
  landfill_cell?: string | null;
  transported_by_vehicle_id?: Uuid | null;
  notes?: string | null;
}

export interface RecoveryCertificate {
  id: Uuid;
  certificate_number: string;
  facility_id: Uuid;
  batch_id: Uuid;
  bulk_generator_id: Uuid | null;
  issue_date: string;
  waste_type: string;
  certified_weight_kg: number;
  recovery_method: string;
  issued_by_user_id: Uuid | null;
  verification_status: string;
  certificate_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateRecoveryCertificateInput {
  certificate_number: string;
  facility_id: Uuid;
  batch_id: Uuid;
  bulk_generator_id?: Uuid | null;
  issue_date: string;
  waste_type: string;
  certified_weight_kg: number;
  recovery_method: string;
  issued_by_user_id?: Uuid | null;
  verification_status?: string;
  certificate_url?: string | null;
  notes?: string | null;
}

export type UserListItem = User;

export interface CreateUserInput {
  organization_id?: Uuid | null;
  city_id?: Uuid | null;
  ward_id?: Uuid | null;
  zone_id?: Uuid | null;
  full_name: string;
  email: string;
  phone?: string | null;
  password: string;
  is_superuser?: boolean;
  is_active: boolean;
  is_verified?: boolean;
  role_codes: string[];
}
