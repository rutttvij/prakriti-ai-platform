"use client";

import { useMemo, useState } from "react";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { EntityFormDrawer } from "@/components/crud/entity-form-drawer";
import { EntityTable } from "@/components/crud/entity-table";
import { FieldGrid } from "@/components/crud/field-grid";
import { RowActions } from "@/components/crud/row-actions";
import { FormSelectField, FormTextField, FormTextareaField } from "@/components/forms/form-fields";
import { Button } from "@/components/ui/button";
import { FilterBar } from "@/components/ui-extensions/filter-bar";
import { PageHeader } from "@/components/ui-extensions/page-header";
import { StatusBadge } from "@/components/ui-extensions/status-badge";
import { Input } from "@/components/ui/input";
import { TRANSFER_ENTITY_TYPES } from "@/lib/constants";
import { getErrorMessage } from "@/lib/api/query-utils";
import { createTransfer, listTransfers } from "@/lib/api/services";
import { formatDateTime } from "@/lib/utils";
import { queryKeys } from "@/types/query-keys";
import type { ColumnDef } from "@/types/table";
import type { Transfer } from "@/types/domain";

const schema = z.object({
  batch_id: z.string().uuid(),
  from_entity_type: z.string().min(1),
  from_entity_id: z.string().uuid().optional().or(z.literal("")),
  to_facility_id: z.string().uuid(),
  dispatched_at: z.string().min(1),
  dispatched_weight_kg: z.coerce.number().positive(),
  manifest_number: z.string().optional(),
  notes: z.string().optional(),
});

const columns: ColumnDef<Transfer>[] = [
  { key: "batch", header: "Batch ID", render: (row) => row.batch_id },
  { key: "to", header: "To Facility", render: (row) => row.to_facility_id },
  { key: "status", header: "Status", render: (row) => <StatusBadge value={row.transfer_status} /> },
  { key: "dispatchWeight", header: "Dispatched (kg)", render: (row) => row.dispatched_weight_kg },
  { key: "receivedWeight", header: "Received (kg)", render: (row) => row.received_weight_kg ?? "-" },
  { key: "dispatchedAt", header: "Dispatched At", render: (row) => formatDateTime(row.dispatched_at) },
];

export default function TransfersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<"create" | "edit" | null>(null);
  const [selected, setSelected] = useState<Transfer | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({
    batch_id: "",
    from_entity_type: "ROUTE",
    from_entity_id: "",
    to_facility_id: "",
    dispatched_at: "",
    dispatched_weight_kg: "",
    manifest_number: "",
    notes: "",
  });

  const query = useQuery({ queryKey: queryKeys.transfers.list(), queryFn: () => listTransfers() });
  const createMutation = useMutation({
    mutationFn: createTransfer,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.transfers.all });
      setMode(null);
      setFormError(null);
    },
  });

  const rows = useMemo(
    () => (query.data ?? []).filter((row) => [row.batch_id, row.to_facility_id, row.transfer_status].join(" ").toLowerCase().includes(search.toLowerCase())),
    [query.data, search],
  );

  function submitCreate() {
    const parsed = schema.safeParse({ ...form, dispatched_weight_kg: Number(form.dispatched_weight_kg) });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "Invalid form");
      return;
    }
    createMutation.mutate({
      ...parsed.data,
      from_entity_id: parsed.data.from_entity_id || null,
      manifest_number: parsed.data.manifest_number || null,
      notes: parsed.data.notes || null,
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Transfers" description="Dispatch and track movement of collected batches to facilities." actions={<Button onClick={() => setMode("create")}>Create Transfer</Button>} />
      <FilterBar onReset={() => setSearch("")}>
        <Input placeholder="Search transfer" value={search} onChange={(event) => setSearch(event.target.value)} />
      </FilterBar>
      <EntityTable
        columns={columns}
        rows={rows}
        isLoading={query.isLoading}
        isError={query.isError}
        errorMessage={getErrorMessage(query.error)}
        emptyTitle="No transfers found"
        emptyDescription="Create transfer records to move batches to processing facilities."
        onRetry={() => void query.refetch()}
        rowActions={(row) => <RowActions row={row} viewHref={`/transfers/${row.id}`} onEdit={(item) => { setSelected(item); setMode("edit"); }} />}
      />

      <EntityFormDrawer
        open={mode === "create" || mode === "edit"}
        onOpenChange={(open) => !open && setMode(null)}
        title={mode === "create" ? "Create Transfer" : `Edit Transfer ${selected?.id ?? ""}`}
        subtitle="Transfer dispatch details"
        mode={mode === "edit" ? "edit" : "create"}
        isSubmitting={createMutation.isPending}
        onSubmit={submitCreate}
      >
        <FieldGrid>
          <FormTextField label="Batch ID" value={mode === "edit" ? selected?.batch_id ?? "" : form.batch_id} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, batch_id: value }))} />
          <FormSelectField label="From Entity Type" value={mode === "edit" ? selected?.from_entity_type ?? "ROUTE" : form.from_entity_type} disabled={mode === "edit"} options={TRANSFER_ENTITY_TYPES.map((item) => ({ label: item, value: item }))} onChange={(value) => setForm((prev) => ({ ...prev, from_entity_type: value }))} />
          <FormTextField label="From Entity ID" value={mode === "edit" ? selected?.from_entity_id ?? "" : form.from_entity_id} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, from_entity_id: value }))} />
          <FormTextField label="To Facility ID" value={mode === "edit" ? selected?.to_facility_id ?? "" : form.to_facility_id} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, to_facility_id: value }))} />
          <FormTextField label="Dispatched At" type="datetime-local" value={mode === "edit" ? selected?.dispatched_at ?? "" : form.dispatched_at} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, dispatched_at: value }))} />
          <FormTextField label="Dispatched Weight (kg)" type="number" value={mode === "edit" ? String(selected?.dispatched_weight_kg ?? "") : form.dispatched_weight_kg} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, dispatched_weight_kg: value }))} />
          <FormTextField label="Manifest Number" value={mode === "edit" ? selected?.manifest_number ?? "" : form.manifest_number} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, manifest_number: value }))} />
        </FieldGrid>
        <FormTextareaField label="Notes" value={mode === "edit" ? selected?.notes ?? "" : form.notes} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, notes: value }))} />
        {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
        {createMutation.isError ? <p className="text-sm text-red-600">{getErrorMessage(createMutation.error)}</p> : null}
      </EntityFormDrawer>
    </div>
  );
}
