import { apiClient } from "@/lib/api/client";
import type { QueryParams } from "@/types/api";
import type { LoginRequest, TokenResponse, UpdateProfileRequest, User } from "@/types/auth";
import type {
  BulkGeneratorReportPage,
  CarbonLedgerReportPage,
  CityOverviewResponse,
  CityWardComparisonResponse,
  EnvironmentalSummaryReportPage,
  FacilityReportPage,
  PickupReportPage,
  RouteReportPage,
  TransferReportPage,
  WardOverviewResponse,
  WorkerReportPage,
} from "@/types/reporting";
import type {
  BatchLifecycleAuditExport,
  BulkGeneratorLifecycleAuditExport,
  CarbonEventLifecycleAuditExport,
} from "@/types/audit";
import type {
  PlatformAuditLogFilters,
  PlatformAuditLogRecord,
  PlatformDashboardResponse,
  PlatformFeatureFlagItem,
  PlatformSubscriptionItem,
  SystemHealthResponse,
  TenantDetail,
  TenantSummary,
} from "@/types/platform-admin";
import type {
  Batch,
  BulkGenerator,
  CarbonEvent,
  CarbonVerification,
  CarbonLedgerEntry,
  City,
  CreateBatchInput,
  CreateBulkGeneratorInput,
  CreateCityInput,
  CreateFacilityInput,
  CreateFacilityReceiptInput,
  CreateHouseholdInput,
  CreateLandfillRecordInput,
  CreateOrganizationInput,
  CreatePickupLogInput,
  CreatePickupTaskInput,
  CreateProcessingRecordInput,
  CreateRecoveryCertificateInput,
  CreateRouteInput,
  CreateRouteStopInput,
  CreateShiftInput,
  CreateTransferInput,
  CreateUserInput,
  CreateVehicleInput,
  CreateWardInput,
  CreateWorkerInput,
  CreateZoneInput,
  Address,
  EnvironmentalSummary,
  Facility,
  FacilityReceipt,
  Household,
  LandfillRecord,
  Organization,
  PickupLog,
  PickupTask,
  PickupTaskActionResponse,
  PickupTaskCompleteInput,
  PickupTaskMissInput,
  PickupTaskStartInput,
  ProcessingRecord,
  ReceiveTransferInput,
  RecoveryCertificate,
  Route,
  RouteStop,
  Shift,
  Transfer,
  UserListItem,
  Vehicle,
  Ward,
  Worker,
  Zone,
} from "@/types/domain";

function withQuery(params?: QueryParams) {
  if (!params) return undefined;
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ""),
  );
}

export async function login(payload: LoginRequest): Promise<TokenResponse> {
  const body = new URLSearchParams({
    username: payload.email,
    password: payload.password,
  });

  const { data } = await apiClient.post<TokenResponse>("/auth/login", body, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  return data;
}

export async function getCurrentUser(): Promise<User> {
  const { data } = await apiClient.get<User>("/auth/me");
  return data;
}

export async function updateCurrentUserProfile(payload: UpdateProfileRequest): Promise<User> {
  const { data } = await apiClient.patch<User>("/auth/me", payload);
  return data;
}

export async function listOrganizations(params?: QueryParams): Promise<Organization[]> {
  const { data } = await apiClient.get<Organization[]>("/organizations", { params: withQuery(params) });
  return data;
}

export async function createOrganization(payload: CreateOrganizationInput): Promise<Organization> {
  const { data } = await apiClient.post<Organization>("/organizations", payload);
  return data;
}

export async function listCities(params?: QueryParams): Promise<City[]> {
  const { data } = await apiClient.get<City[]>("/cities", { params: withQuery(params) });
  return data;
}

export async function createCity(payload: CreateCityInput): Promise<City> {
  const { data } = await apiClient.post<City>("/cities", payload);
  return data;
}

export async function listWards(params?: QueryParams): Promise<Ward[]> {
  const { data } = await apiClient.get<Ward[]>("/wards", { params: withQuery(params) });
  return data;
}

export async function createWard(payload: CreateWardInput): Promise<Ward> {
  const { data } = await apiClient.post<Ward>("/wards", payload);
  return data;
}

export async function listZones(params?: QueryParams): Promise<Zone[]> {
  const { data } = await apiClient.get<Zone[]>("/zones", { params: withQuery(params) });
  return data;
}

export async function createZone(payload: CreateZoneInput): Promise<Zone> {
  const { data } = await apiClient.post<Zone>("/zones", payload);
  return data;
}

export async function listUsers(params?: QueryParams): Promise<UserListItem[]> {
  const { data } = await apiClient.get<UserListItem[]>("/users", { params: withQuery(params) });
  return data;
}

export async function createUser(payload: CreateUserInput): Promise<UserListItem> {
  const { data } = await apiClient.post<UserListItem>("/users", payload);
  return data;
}

export async function listAddresses(params?: QueryParams): Promise<Address[]> {
  const { data } = await apiClient.get<Address[]>("/addresses", { params: withQuery(params) });
  return data;
}

export async function listHouseholds(params?: QueryParams): Promise<Household[]> {
  const { data } = await apiClient.get<Household[]>("/households", { params: withQuery(params) });
  return data;
}

export async function getHousehold(id: string): Promise<Household> {
  const { data } = await apiClient.get<Household>(`/households/${id}`);
  return data;
}

export async function createHousehold(payload: CreateHouseholdInput): Promise<Household> {
  const { data } = await apiClient.post<Household>("/households", payload);
  return data;
}

export async function listBulkGenerators(params?: QueryParams): Promise<BulkGenerator[]> {
  const { data } = await apiClient.get<BulkGenerator[]>("/bulk-generators", { params: withQuery(params) });
  return data;
}

export async function getBulkGenerator(id: string): Promise<BulkGenerator> {
  const { data } = await apiClient.get<BulkGenerator>(`/bulk-generators/${id}`);
  return data;
}

export async function createBulkGenerator(payload: CreateBulkGeneratorInput): Promise<BulkGenerator> {
  const { data } = await apiClient.post<BulkGenerator>("/bulk-generators", payload);
  return data;
}

export async function listWorkers(params?: QueryParams): Promise<Worker[]> {
  const { data } = await apiClient.get<Worker[]>("/workers", { params: withQuery(params) });
  return data;
}

export async function getWorker(id: string): Promise<Worker> {
  const { data } = await apiClient.get<Worker>(`/workers/${id}`);
  return data;
}

export async function createWorker(payload: CreateWorkerInput): Promise<Worker> {
  const { data } = await apiClient.post<Worker>("/workers", payload);
  return data;
}

export async function listVehicles(params?: QueryParams): Promise<Vehicle[]> {
  const { data } = await apiClient.get<Vehicle[]>("/vehicles", { params: withQuery(params) });
  return data;
}

export async function createVehicle(payload: CreateVehicleInput): Promise<Vehicle> {
  const { data } = await apiClient.post<Vehicle>("/vehicles", payload);
  return data;
}

export async function listRoutes(params?: QueryParams): Promise<Route[]> {
  const { data } = await apiClient.get<Route[]>("/routes", { params: withQuery(params) });
  return data;
}

export async function getRoute(id: string): Promise<Route> {
  const { data } = await apiClient.get<Route>(`/routes/${id}`);
  return data;
}

export async function createRoute(payload: CreateRouteInput): Promise<Route> {
  const { data } = await apiClient.post<Route>("/routes", payload);
  return data;
}

export async function listShifts(params?: QueryParams): Promise<Shift[]> {
  const { data } = await apiClient.get<Shift[]>("/shifts", { params: withQuery(params) });
  return data;
}

export async function getShift(id: string): Promise<Shift> {
  const { data } = await apiClient.get<Shift>(`/shifts/${id}`);
  return data;
}

export async function createShift(payload: CreateShiftInput): Promise<Shift> {
  const { data } = await apiClient.post<Shift>("/shifts", payload);
  return data;
}

export async function listRouteStops(params?: QueryParams): Promise<RouteStop[]> {
  const { data } = await apiClient.get<RouteStop[]>("/route-stops", { params: withQuery(params) });
  return data;
}

export async function getRouteStop(id: string): Promise<RouteStop> {
  const { data } = await apiClient.get<RouteStop>(`/route-stops/${id}`);
  return data;
}

export async function createRouteStop(payload: CreateRouteStopInput): Promise<RouteStop> {
  const { data } = await apiClient.post<RouteStop>("/route-stops", payload);
  return data;
}

export async function listPickupTasks(params?: QueryParams): Promise<PickupTask[]> {
  const { data } = await apiClient.get<PickupTask[]>("/pickup-tasks", { params: withQuery(params) });
  return data;
}

export async function getPickupTask(id: string): Promise<PickupTask> {
  const { data } = await apiClient.get<PickupTask>(`/pickup-tasks/${id}`);
  return data;
}

export async function createPickupTask(payload: CreatePickupTaskInput): Promise<PickupTask> {
  const { data } = await apiClient.post<PickupTask>("/pickup-tasks", payload);
  return data;
}

export async function startPickupTask(id: string, payload: PickupTaskStartInput): Promise<PickupTaskActionResponse> {
  const { data } = await apiClient.post<PickupTaskActionResponse>(`/pickup-tasks/${id}/start`, payload);
  return data;
}

export async function completePickupTask(id: string, payload: PickupTaskCompleteInput): Promise<PickupTaskActionResponse> {
  const { data } = await apiClient.post<PickupTaskActionResponse>(`/pickup-tasks/${id}/complete`, payload);
  return data;
}

export async function missPickupTask(id: string, payload: PickupTaskMissInput): Promise<PickupTaskActionResponse> {
  const { data } = await apiClient.post<PickupTaskActionResponse>(`/pickup-tasks/${id}/miss`, payload);
  return data;
}

export async function listPickupLogs(params?: QueryParams): Promise<PickupLog[]> {
  const { data } = await apiClient.get<PickupLog[]>("/pickup-logs", { params: withQuery(params) });
  return data;
}

export async function getPickupLog(id: string): Promise<PickupLog> {
  const { data } = await apiClient.get<PickupLog>(`/pickup-logs/${id}`);
  return data;
}

export async function createPickupLog(payload: CreatePickupLogInput): Promise<PickupLog> {
  const { data } = await apiClient.post<PickupLog>("/pickup-logs", payload);
  return data;
}

export async function listBatches(params?: QueryParams): Promise<Batch[]> {
  const { data } = await apiClient.get<Batch[]>("/batches", { params: withQuery(params) });
  return data;
}

export async function getBatch(id: string): Promise<Batch> {
  const { data } = await apiClient.get<Batch>(`/batches/${id}`);
  return data;
}

export async function createBatch(payload: CreateBatchInput): Promise<Batch> {
  const { data } = await apiClient.post<Batch>("/batches", payload);
  return data;
}

export async function listTransfers(params?: QueryParams): Promise<Transfer[]> {
  const { data } = await apiClient.get<Transfer[]>("/transfers", { params: withQuery(params) });
  return data;
}

export async function getTransfer(id: string): Promise<Transfer> {
  const { data } = await apiClient.get<Transfer>(`/transfers/${id}`);
  return data;
}

export async function createTransfer(payload: CreateTransferInput): Promise<Transfer> {
  const { data } = await apiClient.post<Transfer>("/transfers", payload);
  return data;
}

export async function receiveTransfer(id: string, payload: ReceiveTransferInput): Promise<Transfer> {
  const { data } = await apiClient.post<Transfer>(`/transfers/${id}/receive`, payload);
  return data;
}

export async function listFacilityReceipts(params?: QueryParams): Promise<FacilityReceipt[]> {
  const { data } = await apiClient.get<FacilityReceipt[]>("/facility-receipts", { params: withQuery(params) });
  return data;
}

export async function getFacilityReceipt(id: string): Promise<FacilityReceipt> {
  const { data } = await apiClient.get<FacilityReceipt>(`/facility-receipts/${id}`);
  return data;
}

export async function createFacilityReceipt(payload: CreateFacilityReceiptInput): Promise<FacilityReceipt> {
  const { data } = await apiClient.post<FacilityReceipt>("/facility-receipts", payload);
  return data;
}

export async function listProcessingRecords(params?: QueryParams): Promise<ProcessingRecord[]> {
  const { data } = await apiClient.get<ProcessingRecord[]>("/processing-records", { params: withQuery(params) });
  return data;
}

export async function getProcessingRecord(id: string): Promise<ProcessingRecord> {
  const { data } = await apiClient.get<ProcessingRecord>(`/processing-records/${id}`);
  return data;
}

export async function createProcessingRecord(payload: CreateProcessingRecordInput): Promise<ProcessingRecord> {
  const { data } = await apiClient.post<ProcessingRecord>("/processing-records", payload);
  return data;
}

export async function listLandfillRecords(params?: QueryParams): Promise<LandfillRecord[]> {
  const { data } = await apiClient.get<LandfillRecord[]>("/landfill-records", { params: withQuery(params) });
  return data;
}

export async function getLandfillRecord(id: string): Promise<LandfillRecord> {
  const { data } = await apiClient.get<LandfillRecord>(`/landfill-records/${id}`);
  return data;
}

export async function createLandfillRecord(payload: CreateLandfillRecordInput): Promise<LandfillRecord> {
  const { data } = await apiClient.post<LandfillRecord>("/landfill-records", payload);
  return data;
}

export async function listRecoveryCertificates(params?: QueryParams): Promise<RecoveryCertificate[]> {
  const { data } = await apiClient.get<RecoveryCertificate[]>("/recovery-certificates", { params: withQuery(params) });
  return data;
}

export async function getRecoveryCertificate(id: string): Promise<RecoveryCertificate> {
  const { data } = await apiClient.get<RecoveryCertificate>(`/recovery-certificates/${id}`);
  return data;
}

export async function createRecoveryCertificate(payload: CreateRecoveryCertificateInput): Promise<RecoveryCertificate> {
  const { data } = await apiClient.post<RecoveryCertificate>("/recovery-certificates", payload);
  return data;
}

export async function listFacilities(params?: QueryParams): Promise<Facility[]> {
  const { data } = await apiClient.get<Facility[]>("/facilities", { params: withQuery(params) });
  return data;
}

export async function getFacility(id: string): Promise<Facility> {
  const { data } = await apiClient.get<Facility>(`/facilities/${id}`);
  return data;
}

export async function createFacility(payload: CreateFacilityInput): Promise<Facility> {
  const { data } = await apiClient.post<Facility>("/facilities", payload);
  return data;
}

export async function listEnvironmentalSummaries(params?: QueryParams): Promise<EnvironmentalSummary[]> {
  const { data } = await apiClient.get<EnvironmentalSummary[]>("/environmental-summaries", {
    params: withQuery(params),
  });
  return data;
}

export async function getEnvironmentalSummary(id: string): Promise<EnvironmentalSummary> {
  const { data } = await apiClient.get<EnvironmentalSummary>(`/environmental-summaries/${id}`);
  return data;
}

export async function listCarbonLedger(params?: QueryParams): Promise<CarbonLedgerEntry[]> {
  const { data } = await apiClient.get<CarbonLedgerEntry[]>("/carbon-ledger", { params: withQuery(params) });
  return data;
}

export async function getCarbonLedgerEntry(id: string): Promise<CarbonLedgerEntry> {
  const { data } = await apiClient.get<CarbonLedgerEntry>(`/carbon-ledger/${id}`);
  return data;
}

export async function listCarbonEvents(params?: QueryParams): Promise<CarbonEvent[]> {
  const { data } = await apiClient.get<CarbonEvent[]>("/carbon-events", { params: withQuery(params) });
  return data;
}

export async function listCarbonVerifications(params?: QueryParams): Promise<CarbonVerification[]> {
  const { data } = await apiClient.get<CarbonVerification[]>("/carbon-verifications", { params: withQuery(params) });
  return data;
}

export async function exportAuditBatchLifecycle(batchId: string): Promise<BatchLifecycleAuditExport> {
  const { data } = await apiClient.get<BatchLifecycleAuditExport>(`/audit/export/batch/${batchId}`);
  return data;
}

export async function exportAuditBulkGeneratorLifecycle(generatorId: string): Promise<BulkGeneratorLifecycleAuditExport> {
  const { data } = await apiClient.get<BulkGeneratorLifecycleAuditExport>(`/audit/export/bulk-generator/${generatorId}`);
  return data;
}

export async function exportAuditCarbonEventLifecycle(eventId: string): Promise<CarbonEventLifecycleAuditExport> {
  const { data } = await apiClient.get<CarbonEventLifecycleAuditExport>(`/audit/export/carbon-event/${eventId}`);
  return data;
}

export async function getDashboardCityOverview(params?: QueryParams): Promise<CityOverviewResponse> {
  const { data } = await apiClient.get<CityOverviewResponse>("/dashboard/city-overview", { params: withQuery(params) });
  return data;
}

export async function getDashboardCityWardComparison(params?: QueryParams): Promise<CityWardComparisonResponse> {
  const { data } = await apiClient.get<CityWardComparisonResponse>("/dashboard/city-ward-comparison", {
    params: withQuery(params),
  });
  return data;
}

export async function getDashboardWardOverview(params?: QueryParams): Promise<WardOverviewResponse> {
  const { data } = await apiClient.get<WardOverviewResponse>("/dashboard/ward-overview", {
    params: withQuery(params),
  });
  return data;
}

export async function getPickupReport(params?: QueryParams): Promise<PickupReportPage> {
  const { data } = await apiClient.get<PickupReportPage>("/reports/pickups", { params: withQuery(params) });
  return data;
}

export async function getWorkerReport(params?: QueryParams): Promise<WorkerReportPage> {
  const { data } = await apiClient.get<WorkerReportPage>("/reports/workers", { params: withQuery(params) });
  return data;
}

export async function getRouteReport(params?: QueryParams): Promise<RouteReportPage> {
  const { data } = await apiClient.get<RouteReportPage>("/reports/routes", { params: withQuery(params) });
  return data;
}

export async function getFacilityReport(params?: QueryParams): Promise<FacilityReportPage> {
  const { data } = await apiClient.get<FacilityReportPage>("/reports/facilities", { params: withQuery(params) });
  return data;
}

export async function getTransferReport(params?: QueryParams): Promise<TransferReportPage> {
  const { data } = await apiClient.get<TransferReportPage>("/reports/transfers", { params: withQuery(params) });
  return data;
}

export async function getBulkGeneratorReport(params?: QueryParams): Promise<BulkGeneratorReportPage> {
  const { data } = await apiClient.get<BulkGeneratorReportPage>("/reports/bulk-generators", { params: withQuery(params) });
  return data;
}

export async function getEnvironmentalSummaryReport(params?: QueryParams): Promise<EnvironmentalSummaryReportPage> {
  const { data } = await apiClient.get<EnvironmentalSummaryReportPage>("/reports/environmental-summary", {
    params: withQuery(params),
  });
  return data;
}

export async function getCarbonLedgerReport(params?: QueryParams): Promise<CarbonLedgerReportPage> {
  const { data } = await apiClient.get<CarbonLedgerReportPage>("/reports/carbon-ledger", { params: withQuery(params) });
  return data;
}

export async function getPlatformAdminDashboard(): Promise<PlatformDashboardResponse> {
  const { data } = await apiClient.get<PlatformDashboardResponse>("/platform-admin/dashboard");
  return data;
}

export async function getPlatformTenants(): Promise<TenantSummary[]> {
  const { data } = await apiClient.get<TenantSummary[]>("/platform-admin/tenants");
  return data;
}

export async function getPlatformTenantDetail(tenantId: string): Promise<TenantDetail> {
  const { data } = await apiClient.get<TenantDetail>(`/platform-admin/tenants/${tenantId}`);
  return data;
}

export async function getPlatformSystemHealth(): Promise<SystemHealthResponse> {
  const { data } = await apiClient.get<SystemHealthResponse>("/platform-admin/system-health");
  return data;
}

export async function getPlatformAuditLogs(params?: PlatformAuditLogFilters): Promise<PlatformAuditLogRecord[]> {
  const { data } = await apiClient.get<PlatformAuditLogRecord[]>("/platform-admin/audit-logs", {
    params: withQuery(params),
  });
  return data;
}

export async function getPlatformSubscriptions(): Promise<PlatformSubscriptionItem[]> {
  const { data } = await apiClient.get<PlatformSubscriptionItem[]>("/platform-admin/subscriptions");
  return data;
}

export async function getPlatformFeatureFlags(): Promise<PlatformFeatureFlagItem[]> {
  const { data } = await apiClient.get<PlatformFeatureFlagItem[]>("/platform-admin/feature-flags");
  return data;
}

async function exportCsv(path: string, fileName: string, params?: QueryParams): Promise<void> {
  const response = await apiClient.get(path, {
    params: withQuery(params),
    responseType: "blob",
  });
  const blob = new Blob([response.data], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function exportPickupsCsv(params?: QueryParams): Promise<void> {
  await exportCsv("/exports/pickups.csv", "pickups.csv", params);
}

export async function exportBulkGeneratorsCsv(params?: QueryParams): Promise<void> {
  await exportCsv("/exports/bulk-generators.csv", "bulk-generators.csv", params);
}

export async function exportEnvironmentalSummariesCsv(params?: QueryParams): Promise<void> {
  await exportCsv("/exports/environmental-summaries.csv", "environmental-summaries.csv", params);
}

export async function exportCarbonLedgerCsv(params?: QueryParams): Promise<void> {
  await exportCsv("/exports/carbon-ledger.csv", "carbon-ledger.csv", params);
}
