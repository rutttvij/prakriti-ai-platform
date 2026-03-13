"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { ExportActionBar } from "@/components/reporting/export-action-bar";
import { ReportFilterBar } from "@/components/reporting/report-filter-bar";
import { StatCardGrid } from "@/components/reporting/stat-card-grid";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DataTableWrapper } from "@/components/tables/data-table-wrapper";
import { SimpleDataTable } from "@/components/tables/simple-data-table";
import { PageHeader } from "@/components/ui-extensions/page-header";
import { StatusBadge } from "@/components/ui-extensions/status-badge";
import { getErrorMessage } from "@/lib/api/query-utils";
import {
  exportBulkGeneratorsCsv,
  exportCarbonLedgerCsv,
  exportEnvironmentalSummariesCsv,
  exportPickupsCsv,
  getBulkGeneratorReport,
  getCarbonLedgerReport,
  getEnvironmentalSummaryReport,
  getFacilityReport,
  getPickupReport,
  getRouteReport,
  getTransferReport,
  getWorkerReport,
} from "@/lib/api/services";
import { formatDate, formatDateTime, formatNumber } from "@/lib/utils";
import { queryKeys } from "@/types/query-keys";
import type { ColumnDef } from "@/types/table";

const sections = [
  { id: "pickups", label: "Pickups" },
  { id: "workers", label: "Workers" },
  { id: "routes", label: "Routes" },
  { id: "facilities", label: "Facilities" },
  { id: "transfers", label: "Transfers" },
  { id: "bulk", label: "Bulk Generators" },
  { id: "environmental", label: "Environmental Summary" },
  { id: "ledger", label: "Carbon Ledger" },
] as const;

type SectionId = (typeof sections)[number]["id"];

export default function ReportsPage() {
  const [activeSection, setActiveSection] = useState<SectionId>("pickups");
  const [search, setSearch] = useState("");
  const [cityId, setCityId] = useState("");
  const [wardId, setWardId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [verificationStatus, setVerificationStatus] = useState("");

  const commonParams = useMemo(
    () => ({
      city_id: cityId || undefined,
      ward_id: wardId || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      limit: 100,
      offset: 0,
    }),
    [cityId, wardId, dateFrom, dateTo],
  );

  const pickupsQuery = useQuery({
    queryKey: queryKeys.reports.pickups({ ...commonParams, status: statusFilter || undefined }),
    queryFn: () => getPickupReport({ ...commonParams, status: statusFilter || undefined }),
    enabled: activeSection === "pickups",
  });
  const workersQuery = useQuery({
    queryKey: queryKeys.reports.workers({ ...commonParams, status: statusFilter || undefined }),
    queryFn: () => getWorkerReport({ ...commonParams, status: statusFilter || undefined }),
    enabled: activeSection === "workers",
  });
  const routesQuery = useQuery({
    queryKey: queryKeys.reports.routes(commonParams),
    queryFn: () => getRouteReport(commonParams),
    enabled: activeSection === "routes",
  });
  const facilitiesQuery = useQuery({
    queryKey: queryKeys.reports.facilities({ ...commonParams, verification_status: verificationStatus || undefined }),
    queryFn: () => getFacilityReport({ ...commonParams, verification_status: verificationStatus || undefined }),
    enabled: activeSection === "facilities",
  });
  const transfersQuery = useQuery({
    queryKey: queryKeys.reports.transfers({ ...commonParams, status: statusFilter || undefined }),
    queryFn: () => getTransferReport({ ...commonParams, status: statusFilter || undefined }),
    enabled: activeSection === "transfers",
  });
  const bulkQuery = useQuery({
    queryKey: queryKeys.reports.bulkGenerators({ ...commonParams, status: statusFilter || undefined, verification_status: verificationStatus || undefined }),
    queryFn: () =>
      getBulkGeneratorReport({
        ...commonParams,
        status: statusFilter || undefined,
        verification_status: verificationStatus || undefined,
      }),
    enabled: activeSection === "bulk",
  });
  const environmentalQuery = useQuery({
    queryKey: queryKeys.reports.environmentalSummary({ ...commonParams, status: statusFilter || undefined }),
    queryFn: () => getEnvironmentalSummaryReport({ ...commonParams, status: statusFilter || undefined }),
    enabled: activeSection === "environmental",
  });
  const ledgerQuery = useQuery({
    queryKey: queryKeys.reports.carbonLedger({ ...commonParams, status: statusFilter || undefined, verification_status: verificationStatus || undefined }),
    queryFn: () =>
      getCarbonLedgerReport({
        ...commonParams,
        status: statusFilter || undefined,
        verification_status: verificationStatus || undefined,
      }),
    enabled: activeSection === "ledger",
  });

  const exportPickups = useMutation({ mutationFn: () => exportPickupsCsv({ ...commonParams, status: statusFilter || undefined }), onSuccess: () => toast.success("Pickups CSV downloaded"), onError: (error) => toast.error(getErrorMessage(error)) });
  const exportBulk = useMutation({ mutationFn: () => exportBulkGeneratorsCsv({ ...commonParams, status: statusFilter || undefined, verification_status: verificationStatus || undefined }), onSuccess: () => toast.success("Bulk generators CSV downloaded"), onError: (error) => toast.error(getErrorMessage(error)) });
  const exportEnvironmental = useMutation({ mutationFn: () => exportEnvironmentalSummariesCsv({ ...commonParams, status: statusFilter || undefined }), onSuccess: () => toast.success("Environmental summaries CSV downloaded"), onError: (error) => toast.error(getErrorMessage(error)) });
  const exportLedger = useMutation({ mutationFn: () => exportCarbonLedgerCsv({ ...commonParams, status: statusFilter || undefined, verification_status: verificationStatus || undefined }), onSuccess: () => toast.success("Carbon ledger CSV downloaded"), onError: (error) => toast.error(getErrorMessage(error)) });

  const activeQuery = (() => {
    if (activeSection === "pickups") return pickupsQuery;
    if (activeSection === "workers") return workersQuery;
    if (activeSection === "routes") return routesQuery;
    if (activeSection === "facilities") return facilitiesQuery;
    if (activeSection === "transfers") return transfersQuery;
    if (activeSection === "bulk") return bulkQuery;
    if (activeSection === "environmental") return environmentalQuery;
    return ledgerQuery;
  })();

  const columns: ColumnDef<Record<string, unknown>>[] = useMemo(() => {
    if (activeSection === "pickups") {
      return [
        { key: "id", header: "Task ID", render: (row) => String(row.id ?? "-") },
        { key: "status", header: "Status", render: (row) => <StatusBadge value={String(row.pickup_status ?? "-")} /> },
        { key: "source", header: "Source", render: (row) => <StatusBadge value={String(row.source_type ?? "-")} /> },
        { key: "scheduled", header: "Scheduled", render: (row) => formatDate(String(row.scheduled_date ?? "")) },
        { key: "weight", header: "Actual Weight (kg)", render: (row) => formatNumber(typeof row.actual_weight_kg === "number" ? row.actual_weight_kg : null) },
      ];
    }
    if (activeSection === "workers") {
      return [
        { key: "name", header: "Name", render: (row) => String(row.full_name ?? "-") },
        { key: "employee", header: "Employee Code", render: (row) => String(row.employee_code ?? "-") },
        { key: "status", header: "Employment", render: (row) => <StatusBadge value={String(row.employment_status ?? "-")} /> },
        { key: "assigned", header: "Assigned", render: (row) => String(row.assigned_tasks ?? "-") },
        { key: "completed", header: "Completed", render: (row) => String(row.completed_tasks ?? "-") },
      ];
    }
    if (activeSection === "routes") {
      return [
        { key: "code", header: "Route Code", render: (row) => String(row.route_code ?? "-") },
        { key: "name", header: "Route Name", render: (row) => String(row.route_name ?? "-") },
        { key: "stops", header: "Stops", render: (row) => String(row.total_stops ?? "-") },
        { key: "tasks", header: "Tasks", render: (row) => String(row.total_tasks ?? "-") },
        { key: "completed", header: "Completed", render: (row) => String(row.completed_tasks ?? "-") },
      ];
    }
    if (activeSection === "facilities") {
      return [
        { key: "code", header: "Facility Code", render: (row) => String(row.facility_code ?? "-") },
        { key: "name", header: "Name", render: (row) => String(row.name ?? "-") },
        { key: "active", header: "Active", render: (row) => <StatusBadge value={row.is_active ? "ACTIVE" : "INACTIVE"} /> },
        { key: "transfers", header: "Transfers", render: (row) => String(row.total_transfers ?? "-") },
        { key: "processed", header: "Processed (kg)", render: (row) => formatNumber(typeof row.total_processed_weight_kg === "number" ? row.total_processed_weight_kg : null) },
      ];
    }
    if (activeSection === "transfers") {
      return [
        { key: "transfer", header: "Transfer ID", render: (row) => String(row.transfer_id ?? "-") },
        { key: "batch", header: "Batch ID", render: (row) => String(row.batch_id ?? "-") },
        { key: "status", header: "Status", render: (row) => <StatusBadge value={String(row.transfer_status ?? "-")} /> },
        { key: "dispatched", header: "Dispatched (kg)", render: (row) => formatNumber(typeof row.dispatched_weight_kg === "number" ? row.dispatched_weight_kg : null) },
        { key: "received", header: "Received (kg)", render: (row) => formatNumber(typeof row.received_weight_kg === "number" ? row.received_weight_kg : null) },
      ];
    }
    if (activeSection === "bulk") {
      return [
        { key: "code", header: "Generator Code", render: (row) => String(row.generator_code ?? "-") },
        { key: "name", header: "Entity", render: (row) => String(row.entity_name ?? "-") },
        { key: "compliance", header: "Compliance", render: (row) => <StatusBadge value={String(row.compliance_status ?? "-")} /> },
        { key: "pickups", header: "Total Pickups", render: (row) => String(row.total_pickups ?? "-") },
        { key: "certWeight", header: "Certified Weight (kg)", render: (row) => formatNumber(typeof row.certified_weight_kg === "number" ? row.certified_weight_kg : null) },
      ];
    }
    if (activeSection === "environmental") {
      return [
        { key: "period", header: "Period", render: (row) => `${String(row.reporting_month ?? "-")}/${String(row.reporting_year ?? "-")}` },
        { key: "status", header: "Status", render: (row) => <StatusBadge value={String(row.summary_status ?? "-")} /> },
        { key: "collected", header: "Collected (kg)", render: (row) => formatNumber(typeof row.total_collected_kg === "number" ? row.total_collected_kg : null) },
        { key: "landfilled", header: "Landfilled (kg)", render: (row) => formatNumber(typeof row.total_landfilled_kg === "number" ? row.total_landfilled_kg : null) },
        { key: "net", header: "Net Emissions (kgCO2e)", render: (row) => formatNumber(typeof row.net_emission_kgco2e === "number" ? row.net_emission_kgco2e : null) },
      ];
    }
    return [
      { key: "entry", header: "Entry ID", render: (row) => String(row.entry_id ?? "-") },
      { key: "type", header: "Entry Type", render: (row) => <StatusBadge value={String(row.entry_type ?? "-")} /> },
      { key: "verification", header: "Verification", render: (row) => <StatusBadge value={String(row.verification_status ?? "-")} /> },
      { key: "period", header: "Period", render: (row) => `${String(row.period_month ?? "-")}/${String(row.period_year ?? "-")}` },
      { key: "quantity", header: "Quantity (kgCO2e)", render: (row) => formatNumber(typeof row.quantity_kgco2e === "number" ? row.quantity_kgco2e : null) },
      { key: "recorded", header: "Recorded", render: (row) => formatDateTime(String(row.recorded_at ?? "")) },
    ];
  }, [activeSection]);

  const reportData = activeQuery.data as
    | {
        rows: Record<string, unknown>[];
        summary?: Record<string, number | string>;
      }
    | undefined;
  const rows = useMemo(() => {
    const rawRows = reportData?.rows ?? [];
    if (!search.trim()) return rawRows;
    return rawRows.filter((row: Record<string, unknown>) => JSON.stringify(row).toLowerCase().includes(search.toLowerCase()));
  }, [reportData?.rows, search]);

  const summaryCards = useMemo(() => {
    const summary = reportData?.summary as Record<string, number | string> | undefined;
    if (!summary) return [];
    return Object.entries(summary).slice(0, 8).map(([key, value]) => ({
      title: key.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase()),
      value: typeof value === "number" ? formatNumber(value) : String(value),
    }));
  }, [reportData?.summary]);

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description="Operational and environmental reporting hub with sectioned analytics and exports." />

      <div className="flex flex-wrap gap-2">
        {sections.map((section) => (
          <Button key={section.id} variant={activeSection === section.id ? "default" : "outline"} onClick={() => setActiveSection(section.id)}>
            {section.label}
          </Button>
        ))}
      </div>

      <ReportFilterBar onReset={() => { setSearch(""); setCityId(""); setWardId(""); setDateFrom(""); setDateTo(""); setStatusFilter(""); setVerificationStatus(""); }}>
        <Input placeholder="Search rows" value={search} onChange={(event) => setSearch(event.target.value)} />
        <Input placeholder="City ID" value={cityId} onChange={(event) => setCityId(event.target.value)} />
        <Input placeholder="Ward ID" value={wardId} onChange={(event) => setWardId(event.target.value)} />
        <Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
        <Input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
        <Input placeholder="Status (module-specific)" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} />
        <Input placeholder="Verification status" value={verificationStatus} onChange={(event) => setVerificationStatus(event.target.value)} />
      </ReportFilterBar>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Export Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <ExportActionBar
            actions={[
              { label: "Export Pickups CSV", onClick: () => exportPickups.mutate(), disabled: activeSection !== "pickups", isLoading: exportPickups.isPending },
              { label: "Export Bulk Generators CSV", onClick: () => exportBulk.mutate(), disabled: activeSection !== "bulk", isLoading: exportBulk.isPending },
              { label: "Export Environmental CSV", onClick: () => exportEnvironmental.mutate(), disabled: activeSection !== "environmental", isLoading: exportEnvironmental.isPending },
              { label: "Export Carbon Ledger CSV", onClick: () => exportLedger.mutate(), disabled: activeSection !== "ledger", isLoading: exportLedger.isPending },
            ]}
          />
        </CardContent>
      </Card>

      {summaryCards.length ? <StatCardGrid items={summaryCards} /> : null}

      <DataTableWrapper
        isLoading={activeQuery.isLoading}
        isError={activeQuery.isError}
        errorMessage={getErrorMessage(activeQuery.error)}
        isEmpty={!rows.length}
        emptyTitle="No report data"
        emptyDescription="Try adjusting filters for this report section."
        onRetry={() => void activeQuery.refetch()}
      >
        <SimpleDataTable columns={columns} data={rows} />
      </DataTableWrapper>
    </div>
  );
}
