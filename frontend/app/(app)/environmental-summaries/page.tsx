"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { ExportActionBar } from "@/components/reporting/export-action-bar";
import { ReportFilterBar } from "@/components/reporting/report-filter-bar";
import { StatCardGrid } from "@/components/reporting/stat-card-grid";
import { SummaryDetailsPanel } from "@/components/reporting/summary-details-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/ui-extensions/page-header";
import { StatusBadge } from "@/components/ui-extensions/status-badge";
import { getErrorMessage } from "@/lib/api/query-utils";
import { exportEnvironmentalSummariesCsv, getEnvironmentalSummary, listEnvironmentalSummaries } from "@/lib/api/services";
import { formatDateTime, formatNumber } from "@/lib/utils";
import { queryKeys } from "@/types/query-keys";

export default function EnvironmentalSummariesPage() {
  const [search, setSearch] = useState("");
  const [cityId, setCityId] = useState("");
  const [wardId, setWardId] = useState("");
  const [reportingMonth, setReportingMonth] = useState("");
  const [reportingYear, setReportingYear] = useState("");
  const [summaryStatus, setSummaryStatus] = useState("");
  const [selectedSummaryId, setSelectedSummaryId] = useState<string | null>(null);

  const params = useMemo(
    () => ({
      city_id: cityId || undefined,
      ward_id: wardId || undefined,
      reporting_month: reportingMonth ? Number(reportingMonth) : undefined,
      reporting_year: reportingYear ? Number(reportingYear) : undefined,
      summary_status: summaryStatus || undefined,
    }),
    [cityId, wardId, reportingMonth, reportingYear, summaryStatus],
  );

  const query = useQuery({ queryKey: queryKeys.environmentalSummaries.list(params), queryFn: () => listEnvironmentalSummaries(params) });
  const detailQuery = useQuery({
    queryKey: selectedSummaryId ? ["environmental-summaries", "detail", selectedSummaryId] : ["environmental-summaries", "detail", "none"],
    queryFn: () => getEnvironmentalSummary(selectedSummaryId!),
    enabled: Boolean(selectedSummaryId),
  });

  const exportMutation = useMutation({
    mutationFn: () => exportEnvironmentalSummariesCsv({ city_id: cityId || undefined, ward_id: wardId || undefined, status: summaryStatus || undefined }),
    onSuccess: () => toast.success("Environmental summaries CSV downloaded"),
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const rows = useMemo(
    () =>
      (query.data ?? []).filter((row) =>
        JSON.stringify(row).toLowerCase().includes(search.toLowerCase()),
      ),
    [query.data, search],
  );

  const aggregates = useMemo(() => {
    const total = rows.length;
    const collected = rows.reduce((acc, row) => acc + (row.total_collected_kg ?? 0), 0);
    const processed = rows.reduce((acc, row) => acc + (row.total_processed_kg ?? 0), 0);
    const landfilled = rows.reduce((acc, row) => acc + (row.total_landfilled_kg ?? 0), 0);
    const netEmissions = rows.reduce((acc, row) => acc + (row.net_emission_kgco2e ?? 0), 0);
    return { total, collected, processed, landfilled, netEmissions };
  }, [rows]);

  return (
    <div className="space-y-6">
      <PageHeader title="Environmental Summaries" description="Monthly environmental performance summaries with drill-down details." />

      <ReportFilterBar
        onReset={() => {
          setSearch("");
          setCityId("");
          setWardId("");
          setReportingMonth("");
          setReportingYear("");
          setSummaryStatus("");
          setSelectedSummaryId(null);
        }}
      >
        <Input placeholder="Search summaries" value={search} onChange={(event) => setSearch(event.target.value)} />
        <Input placeholder="City ID" value={cityId} onChange={(event) => setCityId(event.target.value)} />
        <Input placeholder="Ward ID" value={wardId} onChange={(event) => setWardId(event.target.value)} />
        <Input type="number" min={1} max={12} placeholder="Month" value={reportingMonth} onChange={(event) => setReportingMonth(event.target.value)} />
        <Input type="number" min={2000} max={2100} placeholder="Year" value={reportingYear} onChange={(event) => setReportingYear(event.target.value)} />
        <Input placeholder="Status (DRAFT/GENERATED/VERIFIED/FINALIZED)" value={summaryStatus} onChange={(event) => setSummaryStatus(event.target.value)} />
      </ReportFilterBar>

      <ExportActionBar actions={[{ label: "Export Environmental CSV", onClick: () => exportMutation.mutate(), isLoading: exportMutation.isPending }]} />

      <StatCardGrid
        items={[
          { title: "Total Summaries", value: formatNumber(aggregates.total, 0) },
          { title: "Collected (kg)", value: formatNumber(aggregates.collected) },
          { title: "Processed (kg)", value: formatNumber(aggregates.processed) },
          { title: "Landfilled (kg)", value: formatNumber(aggregates.landfilled) },
          { title: "Net Emissions (kgCO2e)", value: formatNumber(aggregates.netEmissions) },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Summary Table</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Ward</TableHead>
                <TableHead>Collected (kg)</TableHead>
                <TableHead>Processed (kg)</TableHead>
                <TableHead>Landfilled (kg)</TableHead>
                <TableHead>Diversion (%)</TableHead>
                <TableHead>Net Emissions (kgCO2e)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id} className="cursor-pointer" onClick={() => setSelectedSummaryId(row.id)}>
                  <TableCell>{row.reporting_month}/{row.reporting_year}</TableCell>
                  <TableCell><StatusBadge value={row.summary_status} /></TableCell>
                  <TableCell>{row.city_id}</TableCell>
                  <TableCell>{row.ward_id ?? "-"}</TableCell>
                  <TableCell>{formatNumber(row.total_collected_kg)}</TableCell>
                  <TableCell>{formatNumber(row.total_processed_kg)}</TableCell>
                  <TableCell>{formatNumber(row.total_landfilled_kg)}</TableCell>
                  <TableCell>{formatNumber(row.landfill_diversion_percent)}</TableCell>
                  <TableCell>{formatNumber(row.net_emission_kgco2e)}</TableCell>
                </TableRow>
              ))}
              {!rows.length ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-6 text-center text-sm text-slate-500">No environmental summaries found.</TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedSummaryId && detailQuery.data ? (
        <SummaryDetailsPanel
          title="Selected Summary Details"
          items={[
            { label: "Summary ID", value: detailQuery.data.id },
            { label: "City ID", value: detailQuery.data.city_id },
            { label: "Ward ID", value: detailQuery.data.ward_id ?? "-" },
            { label: "Period", value: `${detailQuery.data.reporting_month}/${detailQuery.data.reporting_year}` },
            { label: "Status", value: detailQuery.data.summary_status },
            { label: "Total Recycled (kg)", value: formatNumber(detailQuery.data.total_recycled_kg) },
            { label: "Total Composted (kg)", value: formatNumber(detailQuery.data.total_composted_kg) },
            { label: "Avoided Emissions (kgCO2e)", value: formatNumber(detailQuery.data.avoided_emission_kgco2e) },
            { label: "Generated At", value: formatDateTime(detailQuery.data.generated_at) },
            { label: "Updated At", value: formatDateTime(detailQuery.data.updated_at) },
          ]}
        />
      ) : null}

      {query.isError ? <p className="text-sm text-red-600">{getErrorMessage(query.error)}</p> : null}
      {detailQuery.isError ? <p className="text-sm text-red-600">{getErrorMessage(detailQuery.error)}</p> : null}
    </div>
  );
}
