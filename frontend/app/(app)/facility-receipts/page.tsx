"use client";

import { useMemo, useState } from "react";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { EntityFormDrawer } from "@/components/crud/entity-form-drawer";
import { EntityTable } from "@/components/crud/entity-table";
import { FieldGrid } from "@/components/crud/field-grid";
import { FormSelectField, FormTextField, FormTextareaField } from "@/components/forms/form-fields";
import { Button } from "@/components/ui/button";
import { FilterBar } from "@/components/ui-extensions/filter-bar";
import { PageHeader } from "@/components/ui-extensions/page-header";
import { StatusBadge } from "@/components/ui-extensions/status-badge";
import { Input } from "@/components/ui/input";
import { VERIFICATION_STATUSES } from "@/lib/constants";
import { getErrorMessage } from "@/lib/api/query-utils";
import { createFacilityReceipt, listFacilityReceipts } from "@/lib/api/services";
import { formatDateTime } from "@/lib/utils";
import { queryKeys } from "@/types/query-keys";
import type { ColumnDef } from "@/types/table";
import type { FacilityReceipt } from "@/types/domain";

const schema = z.object({
  transfer_record_id: z.string().uuid(),
  facility_id: z.string().uuid(),
  received_by_user_id: z.string().uuid().optional().or(z.literal("")),
  received_at: z.string().min(1),
  gross_weight_kg: z.coerce.number().nonnegative().optional(),
  net_weight_kg: z.coerce.number().positive(),
  contamination_notes: z.string().optional(),
  verification_status: z.string().min(1),
  proof_document_url: z.string().url().optional().or(z.literal("")),
  notes: z.string().optional(),
});

const columns: ColumnDef<FacilityReceipt>[] = [
  { key: "transfer", header: "Transfer ID", render: (row) => row.transfer_record_id },
  { key: "facility", header: "Facility ID", render: (row) => row.facility_id },
  { key: "net", header: "Net Weight (kg)", render: (row) => row.net_weight_kg },
  { key: "verification", header: "Verification", render: (row) => <StatusBadge value={row.verification_status} /> },
  { key: "receivedAt", header: "Received At", render: (row) => formatDateTime(row.received_at) },
];

export default function FacilityReceiptsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<"create" | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({
    transfer_record_id: "",
    facility_id: "",
    received_by_user_id: "",
    received_at: "",
    gross_weight_kg: "",
    net_weight_kg: "",
    contamination_notes: "",
    verification_status: "PENDING",
    proof_document_url: "",
    notes: "",
  });

  const query = useQuery({ queryKey: queryKeys.facilityReceipts.list(), queryFn: () => listFacilityReceipts() });
  const createMutation = useMutation({
    mutationFn: createFacilityReceipt,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.facilityReceipts.all });
      setMode(null);
      setFormError(null);
    },
  });

  const rows = useMemo(
    () => (query.data ?? []).filter((row) => [row.transfer_record_id, row.facility_id, row.verification_status].join(" ").toLowerCase().includes(search.toLowerCase())),
    [query.data, search],
  );

  function submitCreate() {
    const parsed = schema.safeParse({
      ...form,
      gross_weight_kg: form.gross_weight_kg ? Number(form.gross_weight_kg) : undefined,
      net_weight_kg: Number(form.net_weight_kg),
    });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "Invalid form");
      return;
    }
    createMutation.mutate({
      ...parsed.data,
      received_by_user_id: parsed.data.received_by_user_id || null,
      gross_weight_kg: parsed.data.gross_weight_kg ?? null,
      contamination_notes: parsed.data.contamination_notes || null,
      proof_document_url: parsed.data.proof_document_url || null,
      notes: parsed.data.notes || null,
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Facility Receipts" description="Receipt and verification records at processing facilities." actions={<Button onClick={() => setMode("create")}>Create Receipt</Button>} />
      <FilterBar onReset={() => setSearch("")}>
        <Input placeholder="Search receipt" value={search} onChange={(event) => setSearch(event.target.value)} />
      </FilterBar>
      <EntityTable
        columns={columns}
        rows={rows}
        isLoading={query.isLoading}
        isError={query.isError}
        errorMessage={getErrorMessage(query.error)}
        emptyTitle="No facility receipts found"
        emptyDescription="Receipts appear when transfers are received."
        onRetry={() => void query.refetch()}
      />
      <EntityFormDrawer open={mode === "create"} onOpenChange={(open) => !open && setMode(null)} title="Create Facility Receipt" subtitle="Manual receipt entry" mode="create" isSubmitting={createMutation.isPending} onSubmit={submitCreate}>
        <FieldGrid>
          <FormTextField label="Transfer Record ID" value={form.transfer_record_id} onChange={(value) => setForm((prev) => ({ ...prev, transfer_record_id: value }))} />
          <FormTextField label="Facility ID" value={form.facility_id} onChange={(value) => setForm((prev) => ({ ...prev, facility_id: value }))} />
          <FormTextField label="Received By User ID" value={form.received_by_user_id} onChange={(value) => setForm((prev) => ({ ...prev, received_by_user_id: value }))} />
          <FormTextField label="Received At" type="datetime-local" value={form.received_at} onChange={(value) => setForm((prev) => ({ ...prev, received_at: value }))} />
          <FormTextField label="Gross Weight (kg)" type="number" value={form.gross_weight_kg} onChange={(value) => setForm((prev) => ({ ...prev, gross_weight_kg: value }))} />
          <FormTextField label="Net Weight (kg)" type="number" value={form.net_weight_kg} onChange={(value) => setForm((prev) => ({ ...prev, net_weight_kg: value }))} />
          <FormSelectField label="Verification Status" value={form.verification_status} options={VERIFICATION_STATUSES.map((item) => ({ label: item, value: item }))} onChange={(value) => setForm((prev) => ({ ...prev, verification_status: value }))} />
          <FormTextField label="Proof Document URL" value={form.proof_document_url} onChange={(value) => setForm((prev) => ({ ...prev, proof_document_url: value }))} />
        </FieldGrid>
        <FormTextareaField label="Contamination Notes" value={form.contamination_notes} onChange={(value) => setForm((prev) => ({ ...prev, contamination_notes: value }))} />
        <FormTextareaField label="Notes" value={form.notes} onChange={(value) => setForm((prev) => ({ ...prev, notes: value }))} />
        {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
        {createMutation.isError ? <p className="text-sm text-red-600">{getErrorMessage(createMutation.error)}</p> : null}
      </EntityFormDrawer>
    </div>
  );
}
