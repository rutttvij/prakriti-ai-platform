"use client";

import Link from "next/link";
import { useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { EntityDetailsCard } from "@/components/crud/entity-details-card";
import { FieldGrid } from "@/components/crud/field-grid";
import { FormSelectField, FormTextField, FormTextareaField } from "@/components/forms/form-fields";
import { LifecycleStatusPanel } from "@/components/operations/lifecycle-status-panel";
import { LinkedEntityCard } from "@/components/operations/linked-entity-card";
import { WeightSummaryCard } from "@/components/operations/weight-summary-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/ui-extensions/error-state";
import { LoadingState } from "@/components/ui-extensions/loading-state";
import { PageHeader } from "@/components/ui-extensions/page-header";
import { StatusBadge } from "@/components/ui-extensions/status-badge";
import { VERIFICATION_STATUSES } from "@/lib/constants";
import { getErrorMessage } from "@/lib/api/query-utils";
import { getTransfer, receiveTransfer } from "@/lib/api/services";
import { formatDateTime } from "@/lib/utils";
import { queryKeys } from "@/types/query-keys";

export default function TransferDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    received_at: "",
    received_weight_kg: "",
    gross_weight_kg: "",
    net_weight_kg: "",
    facility_received_by_user_id: "",
    contamination_notes: "",
    proof_document_url: "",
    notes: "",
    verification_status: "PENDING",
  });

  const query = useQuery({ queryKey: queryKeys.transfers.detail(id), queryFn: () => getTransfer(id) });

  const receiveMutation = useMutation({
    mutationFn: () =>
      receiveTransfer(id, {
        received_at: form.received_at || null,
        received_weight_kg: Number(form.received_weight_kg),
        gross_weight_kg: form.gross_weight_kg ? Number(form.gross_weight_kg) : null,
        net_weight_kg: form.net_weight_kg ? Number(form.net_weight_kg) : null,
        facility_received_by_user_id: form.facility_received_by_user_id || null,
        contamination_notes: form.contamination_notes || null,
        proof_document_url: form.proof_document_url || null,
        notes: form.notes || null,
        verification_status: form.verification_status,
        create_receipt: true,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.transfers.detail(id) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.transfers.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.batches.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.facilityReceipts.all });
      toast.success("Transfer marked as received");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  if (query.isLoading) return <LoadingState title="Loading transfer" description="Fetching transfer dispatch and receipt details." />;
  if (query.isError || !query.data) return <ErrorState description={getErrorMessage(query.error)} onRetry={() => void query.refetch()} />;

  const data = query.data;
  const isReceived = data.transfer_status === "RECEIVED";

  return (
    <div className="space-y-6">
      <PageHeader title={`Transfer ${data.id}`} description="Transfer lifecycle from dispatch to facility receipt." actions={<Button variant="outline" asChild><Link href="/transfers">Back to Transfers</Link></Button>} />

      <LifecycleStatusPanel
        status={data.transfer_status}
        summary={[
          { label: "Batch ID", value: data.batch_id },
          { label: "To Facility", value: data.to_facility_id },
          { label: "Dispatched At", value: formatDateTime(data.dispatched_at) },
          { label: "Received At", value: formatDateTime(data.received_at) },
        ]}
      />

      <WeightSummaryCard dispatchedWeightKg={data.dispatched_weight_kg} receivedWeightKg={data.received_weight_kg} />

      <EntityDetailsCard
        title="Transfer Metadata"
        items={[
          { label: "From Entity Type", value: <StatusBadge value={data.from_entity_type} /> },
          { label: "From Entity ID", value: data.from_entity_id ?? "-" },
          { label: "Manifest Number", value: data.manifest_number ?? "-" },
          { label: "Notes", value: data.notes ?? "-" },
          { label: "Created", value: formatDateTime(data.created_at) },
          { label: "Updated", value: formatDateTime(data.updated_at) },
        ]}
      />

      <LinkedEntityCard
        title="Linked Workflow"
        items={[
          { label: "Batch", value: data.batch_id, href: `/batches/${data.batch_id}` },
          { label: "Facility Receipts", value: "Open facility receipts", href: "/facility-receipts" },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Receive Transfer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isReceived ? (
            <Alert>
              <AlertTitle>Transfer already received</AlertTitle>
              <AlertDescription>This transfer has been received and its status is locked.</AlertDescription>
            </Alert>
          ) : null}
          <FieldGrid>
            <FormTextField label="Received At" type="datetime-local" value={form.received_at} disabled={isReceived} onChange={(value) => setForm((prev) => ({ ...prev, received_at: value }))} />
            <FormTextField label="Received Weight (kg)" type="number" value={form.received_weight_kg} disabled={isReceived} onChange={(value) => setForm((prev) => ({ ...prev, received_weight_kg: value }))} />
            <FormTextField label="Gross Weight (kg)" type="number" value={form.gross_weight_kg} disabled={isReceived} onChange={(value) => setForm((prev) => ({ ...prev, gross_weight_kg: value }))} />
            <FormTextField label="Net Weight (kg)" type="number" value={form.net_weight_kg} disabled={isReceived} onChange={(value) => setForm((prev) => ({ ...prev, net_weight_kg: value }))} />
            <FormTextField label="Received By User ID" value={form.facility_received_by_user_id} disabled={isReceived} onChange={(value) => setForm((prev) => ({ ...prev, facility_received_by_user_id: value }))} />
            <FormSelectField label="Verification Status" value={form.verification_status} disabled={isReceived} options={VERIFICATION_STATUSES.map((item) => ({ label: item, value: item }))} onChange={(value) => setForm((prev) => ({ ...prev, verification_status: value }))} />
            <FormTextField label="Proof Document URL" value={form.proof_document_url} disabled={isReceived} onChange={(value) => setForm((prev) => ({ ...prev, proof_document_url: value }))} />
          </FieldGrid>
          <FormTextareaField label="Contamination Notes" value={form.contamination_notes} disabled={isReceived} onChange={(value) => setForm((prev) => ({ ...prev, contamination_notes: value }))} />
          <FormTextareaField label="Receipt Notes" value={form.notes} disabled={isReceived} onChange={(value) => setForm((prev) => ({ ...prev, notes: value }))} />
          <div className="flex justify-end">
            <Button onClick={() => receiveMutation.mutate()} disabled={isReceived || receiveMutation.isPending || !form.received_weight_kg}>
              {receiveMutation.isPending ? "Receiving..." : "Receive Transfer"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
