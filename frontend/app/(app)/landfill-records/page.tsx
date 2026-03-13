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
import { DISPOSAL_METHODS } from "@/lib/constants";
import { getErrorMessage } from "@/lib/api/query-utils";
import { createLandfillRecord, listLandfillRecords } from "@/lib/api/services";
import { formatDate } from "@/lib/utils";
import { queryKeys } from "@/types/query-keys";
import type { ColumnDef } from "@/types/table";
import type { LandfillRecord } from "@/types/domain";

const schema = z.object({
  facility_id: z.string().uuid(),
  batch_id: z.string().uuid().optional().or(z.literal("")),
  disposal_date: z.string().min(1),
  waste_weight_kg: z.coerce.number().positive(),
  disposal_method: z.string().min(1),
  landfill_cell: z.string().optional(),
  transported_by_vehicle_id: z.string().uuid().optional().or(z.literal("")),
  notes: z.string().optional(),
});

const columns: ColumnDef<LandfillRecord>[] = [
  { key: "facility", header: "Facility ID", render: (row) => row.facility_id },
  { key: "batch", header: "Batch ID", render: (row) => row.batch_id ?? "-" },
  { key: "method", header: "Disposal Method", render: (row) => <StatusBadge value={row.disposal_method} /> },
  { key: "weight", header: "Weight (kg)", render: (row) => row.waste_weight_kg },
  { key: "date", header: "Disposal Date", render: (row) => formatDate(row.disposal_date) },
];

export default function LandfillRecordsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<"create" | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({
    facility_id: "",
    batch_id: "",
    disposal_date: "",
    waste_weight_kg: "",
    disposal_method: "LANDFILL",
    landfill_cell: "",
    transported_by_vehicle_id: "",
    notes: "",
  });

  const query = useQuery({ queryKey: queryKeys.landfillRecords.list(), queryFn: () => listLandfillRecords() });
  const createMutation = useMutation({
    mutationFn: createLandfillRecord,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.landfillRecords.all });
      setMode(null);
      setFormError(null);
    },
  });

  const rows = useMemo(
    () => (query.data ?? []).filter((row) => [row.facility_id, row.batch_id ?? "", row.disposal_method].join(" ").toLowerCase().includes(search.toLowerCase())),
    [query.data, search],
  );

  function submitCreate() {
    const parsed = schema.safeParse({ ...form, waste_weight_kg: Number(form.waste_weight_kg) });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "Invalid form");
      return;
    }
    createMutation.mutate({
      ...parsed.data,
      batch_id: parsed.data.batch_id || null,
      landfill_cell: parsed.data.landfill_cell || null,
      transported_by_vehicle_id: parsed.data.transported_by_vehicle_id || null,
      notes: parsed.data.notes || null,
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Landfill Records" description="Track disposed residual waste by landfill method and cell." actions={<Button onClick={() => setMode("create")}>Create Landfill Record</Button>} />
      <FilterBar onReset={() => setSearch("")}>
        <Input placeholder="Search landfill record" value={search} onChange={(event) => setSearch(event.target.value)} />
      </FilterBar>
      <EntityTable
        columns={columns}
        rows={rows}
        isLoading={query.isLoading}
        isError={query.isError}
        errorMessage={getErrorMessage(query.error)}
        emptyTitle="No landfill records found"
        emptyDescription="Create records for residual waste sent to landfill."
        onRetry={() => void query.refetch()}
      />

      <EntityFormDrawer open={mode === "create"} onOpenChange={(open) => !open && setMode(null)} title="Create Landfill Record" subtitle="Residual disposal entry" mode="create" isSubmitting={createMutation.isPending} onSubmit={submitCreate}>
        <FieldGrid>
          <FormTextField label="Facility ID" value={form.facility_id} onChange={(value) => setForm((prev) => ({ ...prev, facility_id: value }))} />
          <FormTextField label="Batch ID" value={form.batch_id} onChange={(value) => setForm((prev) => ({ ...prev, batch_id: value }))} />
          <FormTextField label="Disposal Date" type="date" value={form.disposal_date} onChange={(value) => setForm((prev) => ({ ...prev, disposal_date: value }))} />
          <FormTextField label="Waste Weight (kg)" type="number" value={form.waste_weight_kg} onChange={(value) => setForm((prev) => ({ ...prev, waste_weight_kg: value }))} />
          <FormSelectField label="Disposal Method" value={form.disposal_method} options={DISPOSAL_METHODS.map((item) => ({ label: item, value: item }))} onChange={(value) => setForm((prev) => ({ ...prev, disposal_method: value }))} />
          <FormTextField label="Landfill Cell" value={form.landfill_cell} onChange={(value) => setForm((prev) => ({ ...prev, landfill_cell: value }))} />
          <FormTextField label="Transported By Vehicle ID" value={form.transported_by_vehicle_id} onChange={(value) => setForm((prev) => ({ ...prev, transported_by_vehicle_id: value }))} />
        </FieldGrid>
        <FormTextareaField label="Notes" value={form.notes} onChange={(value) => setForm((prev) => ({ ...prev, notes: value }))} />
        {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
        {createMutation.isError ? <p className="text-sm text-red-600">{getErrorMessage(createMutation.error)}</p> : null}
      </EntityFormDrawer>
    </div>
  );
}
