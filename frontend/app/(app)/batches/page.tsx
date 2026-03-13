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
import { BATCH_STATUSES, BOOLEAN_OPTIONS } from "@/lib/constants";
import { getErrorMessage } from "@/lib/api/query-utils";
import { createBatch, listBatches } from "@/lib/api/services";
import { formatDate } from "@/lib/utils";
import { queryKeys } from "@/types/query-keys";
import type { ColumnDef } from "@/types/table";
import type { Batch } from "@/types/domain";

const schema = z.object({
  city_id: z.string().uuid(),
  ward_id: z.string().uuid(),
  zone_id: z.string().uuid().optional().or(z.literal("")),
  batch_code: z.string().min(2),
  created_date: z.string().min(1),
  source_type_summary: z.string().optional(),
  total_weight_kg: z.coerce.number().nonnegative().optional(),
  batch_status: z.string().min(1),
  assigned_vehicle_id: z.string().uuid().optional().or(z.literal("")),
  assigned_worker_id: z.string().uuid().optional().or(z.literal("")),
  origin_route_id: z.string().uuid().optional().or(z.literal("")),
  notes: z.string().optional(),
  is_active: z.boolean(),
});

const columns: ColumnDef<Batch>[] = [
  { key: "code", header: "Batch Code", render: (row) => row.batch_code },
  { key: "date", header: "Date", render: (row) => formatDate(row.created_date) },
  { key: "status", header: "Status", render: (row) => <StatusBadge value={row.batch_status} /> },
  { key: "weight", header: "Total Weight (kg)", render: (row) => row.total_weight_kg ?? "-" },
  { key: "route", header: "Origin Route", render: (row) => row.origin_route_id ?? "-" },
];

export default function BatchesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<"create" | "edit" | null>(null);
  const [selected, setSelected] = useState<Batch | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({
    city_id: "",
    ward_id: "",
    zone_id: "",
    batch_code: "",
    created_date: "",
    source_type_summary: "",
    total_weight_kg: "",
    batch_status: "CREATED",
    assigned_vehicle_id: "",
    assigned_worker_id: "",
    origin_route_id: "",
    notes: "",
    is_active: true,
  });

  const query = useQuery({ queryKey: queryKeys.batches.list(), queryFn: () => listBatches() });
  const createMutation = useMutation({
    mutationFn: createBatch,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.batches.all });
      setMode(null);
      setFormError(null);
    },
  });

  const rows = useMemo(
    () => (query.data ?? []).filter((row) => [row.batch_code, row.batch_status, row.origin_route_id ?? ""].join(" ").toLowerCase().includes(search.toLowerCase())),
    [query.data, search],
  );

  function submitCreate() {
    const parsed = schema.safeParse({ ...form, total_weight_kg: form.total_weight_kg ? Number(form.total_weight_kg) : undefined });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "Invalid form");
      return;
    }
    createMutation.mutate({
      ...parsed.data,
      zone_id: parsed.data.zone_id || null,
      source_type_summary: parsed.data.source_type_summary || null,
      total_weight_kg: parsed.data.total_weight_kg ?? null,
      assigned_vehicle_id: parsed.data.assigned_vehicle_id || null,
      assigned_worker_id: parsed.data.assigned_worker_id || null,
      origin_route_id: parsed.data.origin_route_id || null,
      notes: parsed.data.notes || null,
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Batches" description="Collected waste batches ready for transfer and processing workflows." actions={<Button onClick={() => setMode("create")}>Create Batch</Button>} />
      <FilterBar onReset={() => setSearch("")}>
        <Input placeholder="Search batch" value={search} onChange={(event) => setSearch(event.target.value)} />
      </FilterBar>
      <EntityTable
        columns={columns}
        rows={rows}
        isLoading={query.isLoading}
        isError={query.isError}
        errorMessage={getErrorMessage(query.error)}
        emptyTitle="No batches found"
        emptyDescription="Create a batch after pickup completion."
        onRetry={() => void query.refetch()}
        rowActions={(row) => <RowActions row={row} viewHref={`/batches/${row.id}`} onEdit={(item) => { setSelected(item); setMode("edit"); }} />}
      />

      <EntityFormDrawer
        open={mode === "create" || mode === "edit"}
        onOpenChange={(open) => !open && setMode(null)}
        title={mode === "create" ? "Create Batch" : `Edit ${selected?.batch_code ?? "Batch"}`}
        subtitle="Batch creation for post-pickup workflow"
        mode={mode === "edit" ? "edit" : "create"}
        isSubmitting={createMutation.isPending}
        onSubmit={submitCreate}
      >
        <FieldGrid>
          <FormTextField label="City ID" value={mode === "edit" ? selected?.city_id ?? "" : form.city_id} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, city_id: value }))} />
          <FormTextField label="Ward ID" value={mode === "edit" ? selected?.ward_id ?? "" : form.ward_id} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, ward_id: value }))} />
          <FormTextField label="Zone ID" value={mode === "edit" ? selected?.zone_id ?? "" : form.zone_id} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, zone_id: value }))} />
          <FormTextField label="Batch Code" value={mode === "edit" ? selected?.batch_code ?? "" : form.batch_code} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, batch_code: value }))} />
          <FormTextField label="Created Date" type="date" value={mode === "edit" ? selected?.created_date ?? "" : form.created_date} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, created_date: value }))} />
          <FormSelectField label="Batch Status" value={mode === "edit" ? selected?.batch_status ?? "CREATED" : form.batch_status} disabled={mode === "edit"} options={BATCH_STATUSES.map((item) => ({ label: item, value: item }))} onChange={(value) => setForm((prev) => ({ ...prev, batch_status: value }))} />
          <FormTextField label="Total Weight (kg)" type="number" value={mode === "edit" ? String(selected?.total_weight_kg ?? "") : form.total_weight_kg} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, total_weight_kg: value }))} />
          <FormTextField label="Source Type Summary" value={mode === "edit" ? selected?.source_type_summary ?? "" : form.source_type_summary} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, source_type_summary: value }))} />
          <FormTextField label="Assigned Vehicle ID" value={mode === "edit" ? selected?.assigned_vehicle_id ?? "" : form.assigned_vehicle_id} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, assigned_vehicle_id: value }))} />
          <FormTextField label="Assigned Worker ID" value={mode === "edit" ? selected?.assigned_worker_id ?? "" : form.assigned_worker_id} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, assigned_worker_id: value }))} />
          <FormTextField label="Origin Route ID" value={mode === "edit" ? selected?.origin_route_id ?? "" : form.origin_route_id} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, origin_route_id: value }))} />
          <FormSelectField label="Active" value={String(mode === "edit" ? selected?.is_active ?? false : form.is_active)} disabled={mode === "edit"} options={BOOLEAN_OPTIONS} onChange={(value) => setForm((prev) => ({ ...prev, is_active: value === "true" }))} />
        </FieldGrid>
        <FormTextareaField label="Notes" value={mode === "edit" ? selected?.notes ?? "" : form.notes} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, notes: value }))} />
        {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
        {createMutation.isError ? <p className="text-sm text-red-600">{getErrorMessage(createMutation.error)}</p> : null}
      </EntityFormDrawer>
    </div>
  );
}
