"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { EntityDetailsCard } from "@/components/crud/entity-details-card";
import { LifecycleStatusPanel } from "@/components/operations/lifecycle-status-panel";
import { LinkedEntityCard } from "@/components/operations/linked-entity-card";
import { WeightSummaryCard } from "@/components/operations/weight-summary-card";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui-extensions/error-state";
import { LoadingState } from "@/components/ui-extensions/loading-state";
import { PageHeader } from "@/components/ui-extensions/page-header";
import { StatusBadge } from "@/components/ui-extensions/status-badge";
import { getErrorMessage } from "@/lib/api/query-utils";
import { getBatch, listFacilityReceipts, listLandfillRecords, listProcessingRecords, listRecoveryCertificates, listTransfers } from "@/lib/api/services";
import { formatDate, formatDateTime } from "@/lib/utils";
import { queryKeys } from "@/types/query-keys";

export default function BatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const query = useQuery({ queryKey: queryKeys.batches.detail(id), queryFn: () => getBatch(id) });
  const transfersQuery = useQuery({ queryKey: queryKeys.transfers.list({ batch_id: id }), queryFn: () => listTransfers({ batch_id: id }) });
  const receiptsQuery = useQuery({ queryKey: queryKeys.facilityReceipts.list({ batch_id: id }), queryFn: async () => {
    const transfers = await listTransfers({ batch_id: id });
    if (!transfers.length) return [];
    const receiptLists = await Promise.all(transfers.map((transfer) => listFacilityReceipts({ transfer_record_id: transfer.id })));
    return receiptLists.flat();
  } });
  const processingQuery = useQuery({ queryKey: queryKeys.processingRecords.list({ batch_id: id }), queryFn: () => listProcessingRecords({ batch_id: id }) });
  const landfillQuery = useQuery({ queryKey: queryKeys.landfillRecords.list({ batch_id: id }), queryFn: () => listLandfillRecords({ batch_id: id }) });
  const recoveryQuery = useQuery({ queryKey: queryKeys.recoveryCertificates.list({ batch_id: id }), queryFn: () => listRecoveryCertificates({ batch_id: id }) });

  if (query.isLoading) return <LoadingState title="Loading batch" description="Fetching batch lifecycle details." />;
  if (query.isError || !query.data) return <ErrorState description={getErrorMessage(query.error)} onRetry={() => void query.refetch()} />;

  const data = query.data;

  return (
    <div className="space-y-6">
      <PageHeader title={data.batch_code} description="Batch lifecycle from collection to final processing/disposal." actions={<Button variant="outline" asChild><Link href="/batches">Back to Batches</Link></Button>} />

      <LifecycleStatusPanel
        status={data.batch_status}
        summary={[
          { label: "Created Date", value: formatDate(data.created_date) },
          { label: "Transfers", value: transfersQuery.data?.length ?? 0 },
          { label: "Receipts", value: receiptsQuery.data?.length ?? 0 },
          { label: "Processing Records", value: processingQuery.data?.length ?? 0 },
          { label: "Landfill Records", value: landfillQuery.data?.length ?? 0 },
          { label: "Recovery Certificates", value: recoveryQuery.data?.length ?? 0 },
        ]}
      />

      <WeightSummaryCard expectedWeightKg={data.total_weight_kg} actualWeightKg={data.total_weight_kg} />

      <EntityDetailsCard
        title="Batch Metadata"
        items={[
          { label: "Batch ID", value: data.id },
          { label: "Source Type Summary", value: data.source_type_summary ?? "-" },
          { label: "Assigned Worker ID", value: data.assigned_worker_id ?? "-" },
          { label: "Assigned Vehicle ID", value: data.assigned_vehicle_id ?? "-" },
          { label: "Origin Route ID", value: data.origin_route_id ?? "-" },
          { label: "Status", value: <StatusBadge value={data.batch_status} /> },
        ]}
      />

      <EntityDetailsCard
        title="Scope and Timeline"
        items={[
          { label: "City ID", value: data.city_id },
          { label: "Ward ID", value: data.ward_id },
          { label: "Zone ID", value: data.zone_id ?? "-" },
          { label: "Created", value: formatDateTime(data.created_at) },
          { label: "Updated", value: formatDateTime(data.updated_at) },
          { label: "Notes", value: data.notes ?? "-" },
        ]}
      />

      <LinkedEntityCard
        title="Linked Workflow"
        items={[
          { label: "Transfers", value: "Open transfer records", href: "/transfers" },
          { label: "Facility Receipts", value: "Open receipt records", href: "/facility-receipts" },
          { label: "Processing", value: "Open processing records", href: "/processing-records" },
          { label: "Landfill", value: "Open landfill records", href: "/landfill-records" },
          { label: "Recovery Certificates", value: "Open certificates", href: "/recovery-certificates" },
        ]}
      />
    </div>
  );
}
