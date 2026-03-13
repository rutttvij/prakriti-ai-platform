"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { ComparisonTableSection } from "@/components/reporting/comparison-table-section";
import { MetricHighlightCard } from "@/components/reporting/metric-highlight-card";
import { ReportFilterBar } from "@/components/reporting/report-filter-bar";
import { StatCardGrid } from "@/components/reporting/stat-card-grid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui-extensions/page-header";
import { StatusBadge } from "@/components/ui-extensions/status-badge";
import { getPrimaryRole, type AppRole } from "@/lib/auth/rbac";
import {
  getBulkGeneratorReport,
  getCarbonLedgerReport,
  getDashboardCityOverview,
  getDashboardCityWardComparison,
  getDashboardWardOverview,
  getEnvironmentalSummaryReport,
  getPickupReport,
  getTransferReport,
  getWorkerReport,
  listBatches,
  listFacilityReceipts,
  listPickupTasks,
  listProcessingRecords,
  listRecoveryCertificates,
  listRoutes,
  listShifts,
  listTransfers,
  listWorkers,
} from "@/lib/api/services";
import { formatDate, formatNumber } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { queryKeys } from "@/types/query-keys";

function EmptyScopeCard({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="pt-6 text-sm text-slate-600">{message}</CardContent>
    </Card>
  );
}

function CityAdminDashboard({ roleTitle }: { roleTitle: string }) {
  const user = useAuthStore((state) => state.user);
  const [cityIdInput, setCityIdInput] = useState("");
  const cityId = cityIdInput || user?.city_id || undefined;

  const cityOverview = useQuery({
    queryKey: queryKeys.dashboard.cityOverview({ city_id: cityId }),
    queryFn: () => getDashboardCityOverview({ city_id: cityId }),
    enabled: Boolean(cityId),
  });
  const wardComparison = useQuery({
    queryKey: queryKeys.dashboard.cityWardComparison({ city_id: cityId }),
    queryFn: () => getDashboardCityWardComparison({ city_id: cityId }),
    enabled: Boolean(cityId),
  });
  const envReport = useQuery({
    queryKey: queryKeys.reports.environmentalSummary({ city_id: cityId, limit: 5, offset: 0 }),
    queryFn: () => getEnvironmentalSummaryReport({ city_id: cityId, limit: 5, offset: 0 }),
    enabled: Boolean(cityId),
  });
  const pickupReport = useQuery({
    queryKey: queryKeys.reports.pickups({ city_id: cityId, limit: 10, offset: 0 }),
    queryFn: () => getPickupReport({ city_id: cityId, limit: 10, offset: 0 }),
    enabled: Boolean(cityId),
  });

  return (
    <div className="space-y-6">
      <PageHeader title={`${roleTitle} Portal`} description="City KPIs, ward comparison, environmental metrics, and operational trends." />
      <ReportFilterBar onReset={() => setCityIdInput("")}>
        <Input placeholder="City ID" value={cityIdInput} onChange={(event) => setCityIdInput(event.target.value)} />
      </ReportFilterBar>

      {!cityId ? (
        <EmptyScopeCard message="City scope is required to load city portal metrics. Enter city ID or assign city scope to this user." />
      ) : (
        <>
          <StatCardGrid
            items={[
              { title: "Total Households", value: formatNumber(cityOverview.data?.metrics.total_households, 0) },
              { title: "Completed Pickups", value: formatNumber(cityOverview.data?.metrics.completed_pickups, 0) },
              { title: "Missed Pickups", value: formatNumber(cityOverview.data?.metrics.missed_pickups, 0) },
              { title: "Landfill Diversion", value: `${formatNumber(cityOverview.data?.metrics.landfill_diversion_percent)}%` },
              { title: "Net Emissions", value: `${formatNumber(cityOverview.data?.metrics.net_emissions_kgco2e)} kgCO2e` },
            ]}
          />

          <ComparisonTableSection
            title="Ward Comparison"
            metricHeaders={["Completed", "Missed", "Collected (kg)", "Net Emissions (kgCO2e)"]}
            rows={(wardComparison.data?.wards ?? []).map((ward) => ({
              id: ward.ward_id,
              name: ward.ward_name,
              metrics: [
                { label: "completed", value: formatNumber(ward.metrics.completed_pickups, 0) },
                { label: "missed", value: formatNumber(ward.metrics.missed_pickups, 0) },
                { label: "collected", value: formatNumber(ward.metrics.total_collected_weight_kg) },
                { label: "net", value: formatNumber(ward.metrics.net_emissions_kgco2e) },
              ],
            }))}
          />

          <div className="grid gap-4 lg:grid-cols-2">
            <MetricHighlightCard title="Latest Environmental Summaries" value={formatNumber(envReport.data?.summary.total_summaries, 0)} subtitle="Latest 5 rows loaded" />
            <MetricHighlightCard title="Operational Trend" value={formatNumber(pickupReport.data?.summary.completed_tasks, 0)} subtitle="Completed pickups in active report window" />
          </div>
        </>
      )}
    </div>
  );
}

function WardOfficerDashboard() {
  const user = useAuthStore((state) => state.user);
  const cityId = user?.city_id;
  const wardId = user?.ward_id;

  const wardOverview = useQuery({
    queryKey: queryKeys.dashboard.cityOverview({ city_id: cityId, ward_id: wardId }),
    queryFn: () => getDashboardWardOverview({ city_id: cityId, ward_id: wardId }),
    enabled: Boolean(cityId && wardId),
  });
  const workerReport = useQuery({
    queryKey: queryKeys.reports.workers({ city_id: cityId, ward_id: wardId, limit: 10, offset: 0 }),
    queryFn: () => getWorkerReport({ city_id: cityId, ward_id: wardId, limit: 10, offset: 0 }),
    enabled: Boolean(cityId && wardId),
  });
  const transferReport = useQuery({
    queryKey: queryKeys.reports.transfers({ city_id: cityId, ward_id: wardId, limit: 10, offset: 0 }),
    queryFn: () => getTransferReport({ city_id: cityId, ward_id: wardId, limit: 10, offset: 0 }),
    enabled: Boolean(cityId && wardId),
  });

  if (!cityId || !wardId) {
    return <EmptyScopeCard message="Ward officer dashboard requires city and ward scoped user profile." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Ward Officer Portal" description="Ward KPIs, pickup completion, worker performance, and facility transfers." />
      <StatCardGrid
        items={[
          { title: "Ward Pickup Tasks", value: formatNumber(wardOverview.data?.metrics.total_pickup_tasks, 0) },
          { title: "Completed Pickups", value: formatNumber(wardOverview.data?.metrics.completed_pickups, 0) },
          { title: "Missed Pickups", value: formatNumber(wardOverview.data?.metrics.missed_pickups, 0) },
          { title: "Collected (kg)", value: formatNumber(wardOverview.data?.metrics.total_collected_weight_kg) },
          { title: "Landfilled (kg)", value: formatNumber(wardOverview.data?.metrics.total_landfilled_weight_kg) },
        ]}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <MetricHighlightCard title="Worker Performance Proxy" value={formatNumber(workerReport.data?.summary.total_completed_tasks, 0)} subtitle="Completed tasks by workers in ward" />
        <MetricHighlightCard title="Facility Transfers" value={formatNumber(transferReport.data?.summary.total_transfers, 0)} subtitle="Transfer records in ward scope" />
      </div>
    </div>
  );
}

function SupervisorDashboard() {
  const today = new Date().toISOString().slice(0, 10);
  const shifts = useQuery({ queryKey: queryKeys.shifts.list({ shift_date: today }), queryFn: () => listShifts({ shift_date: today }) });
  const routes = useQuery({ queryKey: queryKeys.routes.list(), queryFn: () => listRoutes() });
  const tasks = useQuery({ queryKey: queryKeys.pickupTasks.list({ scheduled_date: today }), queryFn: () => listPickupTasks({ scheduled_date: today }) });
  const workers = useQuery({ queryKey: queryKeys.workers.list(), queryFn: () => listWorkers() });

  const inProgress = (tasks.data ?? []).filter((task) => task.pickup_status === "IN_PROGRESS").length;
  const completed = (tasks.data ?? []).filter((task) => task.pickup_status === "COMPLETED").length;

  return (
    <div className="space-y-6">
      <PageHeader title="Supervisor Portal" description="Today's shifts, assigned routes, pickup task board, and worker status." />
      <StatCardGrid
        items={[
          { title: "Today's Shifts", value: formatNumber(shifts.data?.length, 0) },
          { title: "Assigned Routes", value: formatNumber(routes.data?.length, 0) },
          { title: "In Progress Tasks", value: formatNumber(inProgress, 0) },
          { title: "Completed Today", value: formatNumber(completed, 0) },
          { title: "Workers", value: formatNumber(workers.data?.length, 0) },
        ]}
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pickup Task Board (Today)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(tasks.data ?? []).slice(0, 12).map((task) => (
            <div key={task.id} className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2">
              <div>
                <p className="text-sm font-medium">{task.id}</p>
                <p className="text-xs text-slate-500">{task.source_type} • Worker {task.assigned_worker_id ?? "-"}</p>
              </div>
              <StatusBadge value={task.pickup_status} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function ProcessorDashboard() {
  const transfers = useQuery({ queryKey: queryKeys.transfers.list({ transfer_status: "DISPATCHED" }), queryFn: () => listTransfers({ transfer_status: "DISPATCHED" }) });
  const receipts = useQuery({ queryKey: queryKeys.facilityReceipts.list(), queryFn: () => listFacilityReceipts() });
  const processing = useQuery({ queryKey: queryKeys.processingRecords.list(), queryFn: () => listProcessingRecords() });
  const batches = useQuery({ queryKey: queryKeys.batches.list(), queryFn: () => listBatches() });

  const throughput = (processing.data ?? []).reduce((acc, row) => acc + row.input_weight_kg, 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Processor Portal" description="Incoming transfers, facility receipts, processing activity, and throughput summary." />
      <StatCardGrid
        items={[
          { title: "Incoming Transfers", value: formatNumber(transfers.data?.length, 0) },
          { title: "Facility Receipts", value: formatNumber(receipts.data?.length, 0) },
          { title: "Processing Records", value: formatNumber(processing.data?.length, 0) },
          { title: "Throughput (kg)", value: formatNumber(throughput) },
          { title: "Tracked Batches", value: formatNumber(batches.data?.length, 0) },
        ]}
      />
    </div>
  );
}

function AuditorDashboard() {
  const ledger = useQuery({ queryKey: queryKeys.reports.carbonLedger({ limit: 20, offset: 0 }), queryFn: () => getCarbonLedgerReport({ limit: 20, offset: 0 }) });
  const pending = useQuery({ queryKey: queryKeys.reports.carbonLedger({ verification_status: "PENDING", limit: 20, offset: 0 }), queryFn: () => getCarbonLedgerReport({ verification_status: "PENDING", limit: 20, offset: 0 }) });

  return (
    <div className="space-y-6">
      <PageHeader title="Auditor Portal" description="Carbon ledger overview, verification queue, and audit export access." />
      <StatCardGrid
        items={[
          { title: "Ledger Entries", value: formatNumber(ledger.data?.summary.total_entries, 0) },
          { title: "Verified", value: formatNumber(ledger.data?.summary.verified_entries, 0) },
          { title: "Rejected", value: formatNumber(ledger.data?.summary.rejected_entries, 0) },
          { title: "Pending Verification", value: formatNumber(pending.data?.summary.total_entries, 0) },
          { title: "Quantity (kgCO2e)", value: formatNumber(ledger.data?.summary.total_quantity_kgco2e) },
        ]}
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Audit Tools</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Link href="/reports" className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50">Open Reports Hub</Link>
          <Link href="/carbon-ledger" className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50">Open Carbon Ledger</Link>
          <Link href="/environmental-summaries" className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50">Open Environmental Summaries</Link>
        </CardContent>
      </Card>
    </div>
  );
}

function BulkGeneratorDashboard() {
  const [generatorId, setGeneratorId] = useState("");
  const pickups = useQuery({ queryKey: queryKeys.reports.pickups({ generator_id: generatorId || undefined, limit: 20, offset: 0 }), queryFn: () => getPickupReport({ generator_id: generatorId || undefined, limit: 20, offset: 0 }), enabled: Boolean(generatorId) });
  const bulkReport = useQuery({ queryKey: queryKeys.reports.bulkGenerators({ generator_id: generatorId || undefined, limit: 20, offset: 0 }), queryFn: () => getBulkGeneratorReport({ generator_id: generatorId || undefined, limit: 20, offset: 0 }), enabled: Boolean(generatorId) });
  const certificates = useQuery({ queryKey: queryKeys.recoveryCertificates.list({ bulk_generator_id: generatorId || undefined }), queryFn: () => listRecoveryCertificates({ bulk_generator_id: generatorId || undefined }), enabled: Boolean(generatorId) });

  const completed = (pickups.data?.rows ?? []).filter((row) => row.pickup_status === "COMPLETED").length;

  return (
    <div className="space-y-6">
      <PageHeader title="Bulk Generator Portal" description="Pickup history, compliance status, recovery certificates, and environmental impact." />
      <ReportFilterBar onReset={() => setGeneratorId("")}>
        <Input placeholder="Generator ID" value={generatorId} onChange={(event) => setGeneratorId(event.target.value)} />
      </ReportFilterBar>

      {!generatorId ? (
        <EmptyScopeCard message="Enter your Bulk Generator ID to load role-specific portal metrics and history." />
      ) : (
        <>
          <StatCardGrid
            items={[
              { title: "Pickup History", value: formatNumber(pickups.data?.rows.length, 0) },
              { title: "Completed Pickups", value: formatNumber(completed, 0) },
              { title: "Compliance Status", value: bulkReport.data?.rows[0]?.compliance_status ?? "-" },
              { title: "Recovery Certificates", value: formatNumber(certificates.data?.length, 0) },
              { title: "Environmental Impact (kg)", value: formatNumber(bulkReport.data?.rows[0]?.certified_weight_kg) },
            ]}
          />
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Pickup History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(pickups.data?.rows ?? []).slice(0, 10).map((row) => (
                <div key={row.id} className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">{row.id}</p>
                    <p className="text-xs text-slate-500">{formatDate(row.scheduled_date)} • {formatNumber(row.actual_weight_kg)} kg</p>
                  </div>
                  <StatusBadge value={row.pickup_status} />
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

export function RoleDashboardContent({ forcedRole }: { forcedRole?: AppRole }) {
  const user = useAuthStore((state) => state.user);
  const role = forcedRole ?? getPrimaryRole(user);

  if (!role) {
    return <EmptyScopeCard message="No active role was found for this account. Contact your administrator." />;
  }

  if (role === "SUPER_ADMIN") return <CityAdminDashboard roleTitle="Super Admin" />;
  if (role === "CITY_ADMIN") return <CityAdminDashboard roleTitle="City Admin" />;
  if (role === "WARD_OFFICER") return <WardOfficerDashboard />;
  if (role === "SANITATION_SUPERVISOR") return <SupervisorDashboard />;
  if (role === "PROCESSOR") return <ProcessorDashboard />;
  if (role === "AUDITOR") return <AuditorDashboard />;
  return <BulkGeneratorDashboard />;
}
