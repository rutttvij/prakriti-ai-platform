"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { ExportActionBar } from "@/components/audit/export-action-bar";
import { FormatSelector } from "@/components/audit/format-selector";
import { LifecyclePreviewCard } from "@/components/audit/lifecycle-preview-card";
import { FormSelectField, FormTextField } from "@/components/forms/form-fields";
import { Card, CardContent } from "@/components/ui/card";
import { ErrorState } from "@/components/ui-extensions/error-state";
import { LoadingState } from "@/components/ui-extensions/loading-state";
import { PageHeader } from "@/components/ui-extensions/page-header";
import { useExportHistory } from "@/hooks/use-export-history";
import { exportPayload } from "@/lib/audit/export-utils";
import { exportAuditCarbonEventLifecycle, listCarbonEvents, listCarbonLedger, listCarbonVerifications } from "@/lib/api/services";
import { useAuthStore } from "@/store/auth-store";
import type { AuditExportFormat } from "@/types/audit";
import { queryKeys } from "@/types/query-keys";

const NONE = "none";

function inDateRange(value: string, from?: string, to?: string): boolean {
  const ts = Date.parse(value);
  if (!Number.isFinite(ts)) return false;
  if (from && ts < Date.parse(from)) return false;
  if (to && ts > Date.parse(`${to}T23:59:59Z`)) return false;
  return true;
}

export default function AuditCarbonExportPage() {
  const user = useAuthStore((state) => state.user);
  const [eventId, setEventId] = useState(NONE);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [payloadKind, setPayloadKind] = useState<"FULL" | "LEDGER_ONLY" | "VERIFICATIONS_ONLY">("FULL");
  const [format, setFormat] = useState<AuditExportFormat>("JSON");
  const { addRecord } = useExportHistory();

  const eventsQuery = useQuery({ queryKey: queryKeys.carbonEvents.list({ event_date_from: dateFrom || undefined, event_date_to: dateTo || undefined }), queryFn: () => listCarbonEvents({ event_date_from: dateFrom || undefined, event_date_to: dateTo || undefined }) });
  const lifecycleQuery = useQuery({ queryKey: queryKeys.audit.carbonExport(eventId), queryFn: () => exportAuditCarbonEventLifecycle(eventId), enabled: eventId !== NONE });

  const ledgerQuery = useQuery({ queryKey: queryKeys.carbonLedger.list(), queryFn: () => listCarbonLedger() });
  const verificationQuery = useQuery({ queryKey: queryKeys.carbonVerifications.list(), queryFn: () => listCarbonVerifications() });

  const rangeLedger = useMemo(() => {
    const ledger = ledgerQuery.data ?? [];
    return ledger.filter((item) => inDateRange(item.recorded_at, dateFrom || undefined, dateTo || undefined));
  }, [ledgerQuery.data, dateFrom, dateTo]);

  const rangeVerifications = useMemo(() => {
    const records = verificationQuery.data ?? [];
    return records.filter((item) => inDateRange(item.created_at, dateFrom || undefined, dateTo || undefined));
  }, [verificationQuery.data, dateFrom, dateTo]);

  const preview = useMemo(() => {
    if (eventId !== NONE && lifecycleQuery.data) {
      return [
        { label: "Carbon Event", value: 1 },
        { label: "Ledger Entries", value: lifecycleQuery.data.ledger_entries.length },
        { label: "Verifications", value: lifecycleQuery.data.verifications.length },
        { label: "Environmental Summaries", value: lifecycleQuery.data.related_environmental_summaries.length },
      ];
    }

    return [
      { label: "Carbon Events", value: eventsQuery.data?.length ?? 0 },
      { label: "Ledger Entries", value: rangeLedger.length },
      { label: "Verifications", value: rangeVerifications.length },
      { label: "Range Mode", value: 1 },
    ];
  }, [eventId, lifecycleQuery.data, eventsQuery.data, rangeLedger.length, rangeVerifications.length]);

  function buildExportPayload() {
    if (eventId !== NONE && lifecycleQuery.data) {
      if (payloadKind === "LEDGER_ONLY") return lifecycleQuery.data.ledger_entries;
      if (payloadKind === "VERIFICATIONS_ONLY") return lifecycleQuery.data.verifications;
      return lifecycleQuery.data;
    }

    if (payloadKind === "LEDGER_ONLY") return rangeLedger;
    if (payloadKind === "VERIFICATIONS_ONLY") return rangeVerifications;

    return {
      generated_at: new Date().toISOString(),
      filters: { date_from: dateFrom || null, date_to: dateTo || null },
      events: eventsQuery.data ?? [],
      ledger_entries: rangeLedger,
      verifications: rangeVerifications,
    };
  }

  function handleExport() {
    try {
      const payload = buildExportPayload();
      exportPayload(payload, format, `audit-carbon-${eventId !== NONE ? eventId : "range"}`);
      addRecord({
        id: `exp_${Date.now()}`,
        export_type: "CARBON",
        format,
        generated_by: user?.email ?? "unknown",
        timestamp: new Date().toISOString(),
        status: "SUCCESS",
        download_link: null,
        reference_id: eventId !== NONE ? eventId : `${dateFrom || "start"}_${dateTo || "end"}`,
      });
      toast.success("Carbon export generated");
    } catch (error) {
      addRecord({
        id: `exp_${Date.now()}`,
        export_type: "CARBON",
        format,
        generated_by: user?.email ?? "unknown",
        timestamp: new Date().toISOString(),
        status: "FAILED",
        download_link: null,
        reference_id: eventId !== NONE ? eventId : `${dateFrom || "start"}_${dateTo || "end"}`,
      });
      toast.error(error instanceof Error ? error.message : "Export failed");
    }
  }

  if (eventsQuery.isLoading || ledgerQuery.isLoading || verificationQuery.isLoading) {
    return <LoadingState title="Loading carbon evidence" description="Fetching events, ledger entries, and verification records." />;
  }

  if (eventsQuery.isError || ledgerQuery.isError || verificationQuery.isError) {
    return <ErrorState title="Unable to load carbon export data" description="Please retry with the latest scope filters." onRetry={() => { void eventsQuery.refetch(); void ledgerQuery.refetch(); void verificationQuery.refetch(); }} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Carbon Export" description="Export carbon lifecycle evidence by event or by date range." />

      <Card>
        <CardContent className="space-y-4 pt-6">
          <FormSelectField
            label="Carbon Event (optional)"
            value={eventId}
            onChange={setEventId}
            options={[{ label: "Date range mode", value: NONE }, ...(eventsQuery.data ?? []).map((event) => ({ label: `${event.event_code} (${event.event_date})`, value: event.id }))]}
          />

          <div className="grid gap-3 md:grid-cols-2">
            <FormTextField label="Date From" type="date" value={dateFrom} onChange={setDateFrom} />
            <FormTextField label="Date To" type="date" value={dateTo} onChange={setDateTo} />
          </div>

          <FormSelectField
            label="Export Scope"
            value={payloadKind}
            onChange={(value) => setPayloadKind(value as "FULL" | "LEDGER_ONLY" | "VERIFICATIONS_ONLY")}
            options={[
              { label: "Full Carbon Evidence", value: "FULL" },
              { label: "Ledger Entries Only", value: "LEDGER_ONLY" },
              { label: "Verification Records Only", value: "VERIFICATIONS_ONLY" },
            ]}
          />

          <FormatSelector value={format} onChange={setFormat} />
          <ExportActionBar onExport={handleExport} disabled={eventId !== NONE && !lifecycleQuery.data && !lifecycleQuery.isError} isLoading={lifecycleQuery.isLoading} exportLabel="Export Carbon Evidence" />
        </CardContent>
      </Card>

      {lifecycleQuery.isError && eventId !== NONE ? <ErrorState title="Carbon event lifecycle unavailable" description="Use date range mode if this event export is restricted." onRetry={() => void lifecycleQuery.refetch()} /> : null}
      <LifecyclePreviewCard title="Carbon Evidence Preview" items={preview} />
    </div>
  );
}
