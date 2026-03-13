"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { ExportActionBar } from "@/components/audit/export-action-bar";
import { FormatSelector } from "@/components/audit/format-selector";
import { LifecyclePreviewCard } from "@/components/audit/lifecycle-preview-card";
import { FormSelectField } from "@/components/forms/form-fields";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui-extensions/page-header";
import { ErrorState } from "@/components/ui-extensions/error-state";
import { LoadingState } from "@/components/ui-extensions/loading-state";
import { useExportHistory } from "@/hooks/use-export-history";
import { exportPayload } from "@/lib/audit/export-utils";
import { exportAuditBatchLifecycle, listBatches, listPickupTasks } from "@/lib/api/services";
import { useAuthStore } from "@/store/auth-store";
import type { AuditExportFormat } from "@/types/audit";
import { queryKeys } from "@/types/query-keys";

const NONE = "none";

export default function AuditBatchExportPage() {
  const user = useAuthStore((state) => state.user);
  const [batchId, setBatchId] = useState(NONE);
  const [format, setFormat] = useState<AuditExportFormat>("JSON");
  const { addRecord } = useExportHistory();

  const batchListQuery = useQuery({ queryKey: queryKeys.batches.list(), queryFn: () => listBatches() });
  const auditQuery = useQuery({ queryKey: queryKeys.audit.batchExport(batchId), queryFn: () => exportAuditBatchLifecycle(batchId), enabled: batchId !== NONE });
  const pickupTasksQuery = useQuery({
    queryKey: queryKeys.pickupTasks.list({
      route_id: auditQuery.data?.batch.origin_route_id ?? undefined,
      scheduled_date: auditQuery.data?.batch.created_date ?? undefined,
    }),
    queryFn: () => listPickupTasks({
      route_id: auditQuery.data?.batch.origin_route_id ?? undefined,
      scheduled_date: auditQuery.data?.batch.created_date ?? undefined,
    }),
    enabled: Boolean(auditQuery.data?.batch.origin_route_id && auditQuery.data?.batch.created_date),
  });

  const preview = useMemo(() => {
    if (!auditQuery.data) return null;
    return [
      { label: "Pickup Tasks", value: pickupTasksQuery.data?.length ?? 0 },
      { label: "Transfers", value: auditQuery.data.transfers.length },
      { label: "Facility Receipts", value: auditQuery.data.facility_receipts.length },
      { label: "Processing Records", value: auditQuery.data.processing_records.length },
      { label: "Landfill Records", value: auditQuery.data.landfill_records.length },
      { label: "Recovery Certificates", value: auditQuery.data.recovery_certificates.length },
      { label: "Carbon Events", value: auditQuery.data.carbon_events.length },
      { label: "Ledger Entries", value: auditQuery.data.carbon_ledger_entries.length },
    ];
  }, [auditQuery.data, pickupTasksQuery.data?.length]);

  function handleExport() {
    if (!auditQuery.data) return;

    try {
      exportPayload({ ...auditQuery.data, pickup_tasks: pickupTasksQuery.data ?? [] }, format, `audit-batch-${batchId}`);
      addRecord({
        id: `exp_${Date.now()}`,
        export_type: "BATCH",
        format,
        generated_by: user?.email ?? "unknown",
        timestamp: new Date().toISOString(),
        status: "SUCCESS",
        download_link: null,
        reference_id: batchId,
      });
      toast.success("Batch export generated");
    } catch (error) {
      addRecord({
        id: `exp_${Date.now()}`,
        export_type: "BATCH",
        format,
        generated_by: user?.email ?? "unknown",
        timestamp: new Date().toISOString(),
        status: "FAILED",
        download_link: null,
        reference_id: batchId,
      });
      toast.error(error instanceof Error ? error.message : "Export failed");
    }
  }

  if (batchListQuery.isLoading) return <LoadingState title="Loading batches" description="Fetching batch options for audit export." />;
  if (batchListQuery.isError) return <ErrorState title="Unable to load batches" description="Please retry." onRetry={() => void batchListQuery.refetch()} />;

  return (
    <div className="space-y-6">
      <PageHeader title="Batch Lifecycle Export" description="Export batch lifecycle evidence from collection to carbon ledger." />

      <Card>
        <CardContent className="space-y-4 pt-6">
          <FormSelectField
            label="Batch"
            value={batchId}
            onChange={setBatchId}
            options={[{ label: "Select batch", value: NONE }, ...(batchListQuery.data ?? []).map((batch) => ({ label: `${batch.batch_code} (${batch.created_date})`, value: batch.id }))]}
          />
          <FormatSelector value={format} onChange={setFormat} />
          <ExportActionBar onExport={handleExport} disabled={!auditQuery.data || auditQuery.isLoading} isLoading={auditQuery.isLoading} exportLabel="Export Batch Evidence" />
        </CardContent>
      </Card>

      {auditQuery.isError ? <ErrorState title="Batch export data unavailable" description="Scope or permissions may restrict this batch export." onRetry={() => void auditQuery.refetch()} /> : null}
      {preview ? <LifecyclePreviewCard title="Lifecycle Preview" items={preview} /> : null}
    </div>
  );
}
