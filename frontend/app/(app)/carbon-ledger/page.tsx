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
import { exportCarbonLedgerCsv, getCarbonLedgerEntry, listCarbonLedger } from "@/lib/api/services";
import { formatDateTime, formatNumber } from "@/lib/utils";
import { queryKeys } from "@/types/query-keys";

export default function CarbonLedgerPage() {
  const [search, setSearch] = useState("");
  const [cityId, setCityId] = useState("");
  const [wardId, setWardId] = useState("");
  const [periodMonth, setPeriodMonth] = useState("");
  const [periodYear, setPeriodYear] = useState("");
  const [verificationStatus, setVerificationStatus] = useState("");
  const [entryType, setEntryType] = useState("");
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

  const params = useMemo(
    () => ({
      city_id: cityId || undefined,
      ward_id: wardId || undefined,
      period_month: periodMonth ? Number(periodMonth) : undefined,
      period_year: periodYear ? Number(periodYear) : undefined,
      verification_status: verificationStatus || undefined,
      entry_type: entryType || undefined,
    }),
    [cityId, wardId, periodMonth, periodYear, verificationStatus, entryType],
  );

  const query = useQuery({ queryKey: queryKeys.carbonLedger.list(params), queryFn: () => listCarbonLedger(params) });
  const detailQuery = useQuery({
    queryKey: selectedEntryId ? queryKeys.carbonLedger.detail(selectedEntryId) : queryKeys.carbonLedger.detail("none"),
    queryFn: () => getCarbonLedgerEntry(selectedEntryId!),
    enabled: Boolean(selectedEntryId),
  });

  const exportMutation = useMutation({
    mutationFn: () => exportCarbonLedgerCsv({ city_id: cityId || undefined, ward_id: wardId || undefined, status: entryType || undefined, verification_status: verificationStatus || undefined }),
    onSuccess: () => toast.success("Carbon ledger CSV downloaded"),
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const rows = useMemo(
    () => (query.data ?? []).filter((row) => JSON.stringify(row).toLowerCase().includes(search.toLowerCase())),
    [query.data, search],
  );

  const aggregates = useMemo(() => {
    const totalEntries = rows.length;
    const totalKgco2e = rows.reduce((acc, row) => acc + row.quantity_kgco2e, 0);
    const verified = rows.filter((row) => row.verification_status === "VERIFIED").length;
    const rejected = rows.filter((row) => row.verification_status === "REJECTED").length;
    return { totalEntries, totalKgco2e, verified, rejected };
  }, [rows]);

  return (
    <div className="space-y-6">
      <PageHeader title="Carbon Ledger" description="Audit-style carbon ledger with verification and period filters." />

      <ReportFilterBar
        onReset={() => {
          setSearch("");
          setCityId("");
          setWardId("");
          setPeriodMonth("");
          setPeriodYear("");
          setVerificationStatus("");
          setEntryType("");
          setSelectedEntryId(null);
        }}
      >
        <Input placeholder="Search ledger entries" value={search} onChange={(event) => setSearch(event.target.value)} />
        <Input placeholder="City ID" value={cityId} onChange={(event) => setCityId(event.target.value)} />
        <Input placeholder="Ward ID" value={wardId} onChange={(event) => setWardId(event.target.value)} />
        <Input type="number" min={1} max={12} placeholder="Period month" value={periodMonth} onChange={(event) => setPeriodMonth(event.target.value)} />
        <Input type="number" min={2000} max={2100} placeholder="Period year" value={periodYear} onChange={(event) => setPeriodYear(event.target.value)} />
        <Input placeholder="Verification (PENDING/VERIFIED/REJECTED)" value={verificationStatus} onChange={(event) => setVerificationStatus(event.target.value)} />
        <Input placeholder="Entry Type (EMISSION/AVOIDED_EMISSION/NET_ADJUSTMENT)" value={entryType} onChange={(event) => setEntryType(event.target.value)} />
      </ReportFilterBar>

      <ExportActionBar actions={[{ label: "Export Carbon Ledger CSV", onClick: () => exportMutation.mutate(), isLoading: exportMutation.isPending }]} />

      <StatCardGrid
        items={[
          { title: "Total Entries", value: formatNumber(aggregates.totalEntries, 0) },
          { title: "Verified Entries", value: formatNumber(aggregates.verified, 0) },
          { title: "Rejected Entries", value: formatNumber(aggregates.rejected, 0) },
          { title: "Total Quantity (kgCO2e)", value: formatNumber(aggregates.totalKgco2e) },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ledger Entries</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Entry Code</TableHead>
                <TableHead>Entry Type</TableHead>
                <TableHead>Verification</TableHead>
                <TableHead>Month/Year</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Ward</TableHead>
                <TableHead>Quantity (kgCO2e)</TableHead>
                <TableHead>Recorded At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id} className="cursor-pointer" onClick={() => setSelectedEntryId(row.id)}>
                  <TableCell>{row.ledger_entry_code}</TableCell>
                  <TableCell><StatusBadge value={row.entry_type} /></TableCell>
                  <TableCell><StatusBadge value={row.verification_status} /></TableCell>
                  <TableCell>{row.period_month ?? "-"}/{row.period_year ?? "-"}</TableCell>
                  <TableCell>{row.city_id ?? "-"}</TableCell>
                  <TableCell>{row.ward_id ?? "-"}</TableCell>
                  <TableCell>{formatNumber(row.quantity_kgco2e)}</TableCell>
                  <TableCell>{formatDateTime(row.recorded_at)}</TableCell>
                </TableRow>
              ))}
              {!rows.length ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-6 text-center text-sm text-slate-500">No carbon ledger entries found.</TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedEntryId && detailQuery.data ? (
        <SummaryDetailsPanel
          title="Ledger Entry Details"
          items={[
            { label: "Entry ID", value: detailQuery.data.id },
            { label: "Entry Code", value: detailQuery.data.ledger_entry_code },
            { label: "Carbon Event ID", value: detailQuery.data.carbon_event_id },
            { label: "Direction", value: detailQuery.data.debit_credit_direction },
            { label: "Entry Type", value: detailQuery.data.entry_type },
            { label: "Verification", value: detailQuery.data.verification_status },
            { label: "Quantity (kgCO2e)", value: formatNumber(detailQuery.data.quantity_kgco2e) },
            { label: "Recorded At", value: formatDateTime(detailQuery.data.recorded_at) },
            { label: "Remarks", value: detailQuery.data.remarks ?? "-" },
          ]}
        />
      ) : null}

      {query.isError ? <p className="text-sm text-red-600">{getErrorMessage(query.error)}</p> : null}
      {detailQuery.isError ? <p className="text-sm text-red-600">{getErrorMessage(detailQuery.error)}</p> : null}
    </div>
  );
}
