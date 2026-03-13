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
import { exportAuditBulkGeneratorLifecycle, listBulkGenerators } from "@/lib/api/services";
import { useAuthStore } from "@/store/auth-store";
import type { AuditExportFormat } from "@/types/audit";
import { queryKeys } from "@/types/query-keys";

const NONE = "none";

export default function AuditGeneratorExportPage() {
  const user = useAuthStore((state) => state.user);
  const [generatorId, setGeneratorId] = useState(NONE);
  const [manualGeneratorId, setManualGeneratorId] = useState("");
  const [format, setFormat] = useState<AuditExportFormat>("JSON");
  const { addRecord } = useExportHistory();
  const effectiveGeneratorId = generatorId !== NONE ? generatorId : manualGeneratorId || NONE;

  const generatorListQuery = useQuery({ queryKey: queryKeys.bulkGenerators.list(), queryFn: () => listBulkGenerators() });
  const auditQuery = useQuery({ queryKey: queryKeys.audit.generatorExport(effectiveGeneratorId), queryFn: () => exportAuditBulkGeneratorLifecycle(effectiveGeneratorId), enabled: effectiveGeneratorId !== NONE });

  const preview = useMemo(() => {
    if (!auditQuery.data) return null;

    const totalPickedKg = auditQuery.data.pickup_tasks.reduce((sum, item) => sum + (item.actual_weight_kg ?? 0), 0);
    const verifiedCertificates = auditQuery.data.recovery_certificates.filter((item) => item.verification_status === "VERIFIED").length;

    return [
      { label: "Pickup History", value: auditQuery.data.pickup_tasks.length },
      { label: "Waste Quantity (kg)", value: Math.round(totalPickedKg) },
      { label: "Certificates", value: auditQuery.data.recovery_certificates.length },
      { label: "Verified Certificates", value: verifiedCertificates },
      { label: "Compliance Status", value: auditQuery.data.generator.compliance_status === "COMPLIANT" ? 1 : 0 },
      { label: "Carbon Events", value: auditQuery.data.carbon_events.length },
    ];
  }, [auditQuery.data]);

  function handleExport() {
    if (!auditQuery.data) return;

    try {
      exportPayload(auditQuery.data, format, `audit-generator-${generatorId}`);
      addRecord({
        id: `exp_${Date.now()}`,
        export_type: "GENERATOR",
        format,
        generated_by: user?.email ?? "unknown",
        timestamp: new Date().toISOString(),
        status: "SUCCESS",
        download_link: null,
        reference_id: effectiveGeneratorId,
      });
      toast.success("Generator export generated");
    } catch (error) {
      addRecord({
        id: `exp_${Date.now()}`,
        export_type: "GENERATOR",
        format,
        generated_by: user?.email ?? "unknown",
        timestamp: new Date().toISOString(),
        status: "FAILED",
        download_link: null,
        reference_id: effectiveGeneratorId,
      });
      toast.error(error instanceof Error ? error.message : "Export failed");
    }
  }

  if (generatorListQuery.isLoading) return <LoadingState title="Loading generators" description="Fetching generator options for export." />;

  return (
    <div className="space-y-6">
      <PageHeader title="Generator Export" description="Export generator pickup history, quantities, certificates, and compliance evidence." />

      <Card>
        <CardContent className="space-y-4 pt-6">
          <FormSelectField
            label="Bulk Generator"
            value={generatorId}
            onChange={setGeneratorId}
            options={[{ label: "Select generator", value: NONE }, ...(generatorListQuery.data ?? []).map((generator) => ({ label: `${generator.generator_code} - ${generator.entity_name}`, value: generator.id }))]}
          />
          <FormTextField label="Generator ID (fallback)" value={manualGeneratorId} onChange={setManualGeneratorId} placeholder="Use if generator list is unavailable for your role" />
          <FormatSelector value={format} onChange={setFormat} />
          <ExportActionBar onExport={handleExport} disabled={!auditQuery.data || auditQuery.isLoading} isLoading={auditQuery.isLoading} exportLabel="Export Generator Evidence" />
        </CardContent>
      </Card>

      {generatorListQuery.isError ? <ErrorState title="Generator list unavailable" description="Enter a generator ID manually if your role has export scope." onRetry={() => void generatorListQuery.refetch()} /> : null}
      {auditQuery.isError ? <ErrorState title="Generator export data unavailable" description="Scope or permissions may restrict this generator export." onRetry={() => void auditQuery.refetch()} /> : null}
      {preview ? <LifecyclePreviewCard title="Generator Evidence Preview" items={preview} /> : null}
    </div>
  );
}
