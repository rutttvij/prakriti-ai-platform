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
import { PROCESS_TYPES, PROCESSING_STATUSES } from "@/lib/constants";
import { getErrorMessage } from "@/lib/api/query-utils";
import { createProcessingRecord, listProcessingRecords } from "@/lib/api/services";
import { formatDateTime } from "@/lib/utils";
import { queryKeys } from "@/types/query-keys";
import type { ColumnDef } from "@/types/table";
import type { ProcessingRecord } from "@/types/domain";

const schema = z.object({
  facility_id: z.string().uuid(),
  batch_id: z.string().uuid(),
  processed_at: z.string().min(1),
  process_type: z.string().min(1),
  input_weight_kg: z.coerce.number().positive(),
  output_recovered_kg: z.coerce.number().nonnegative().optional(),
  output_rejected_kg: z.coerce.number().nonnegative().optional(),
  residue_to_landfill_kg: z.coerce.number().nonnegative().optional(),
  organic_compost_kg: z.coerce.number().nonnegative().optional(),
  recyclable_plastic_kg: z.coerce.number().nonnegative().optional(),
  recyclable_metal_kg: z.coerce.number().nonnegative().optional(),
  recyclable_paper_kg: z.coerce.number().nonnegative().optional(),
  recyclable_glass_kg: z.coerce.number().nonnegative().optional(),
  energy_recovered_kwh: z.coerce.number().nonnegative().optional(),
  processing_status: z.string().min(1),
  notes: z.string().optional(),
});

const columns: ColumnDef<ProcessingRecord>[] = [
  { key: "facility", header: "Facility ID", render: (row) => row.facility_id },
  { key: "batch", header: "Batch ID", render: (row) => row.batch_id },
  { key: "process", header: "Process Type", render: (row) => <StatusBadge value={row.process_type} /> },
  { key: "status", header: "Status", render: (row) => <StatusBadge value={row.processing_status} /> },
  { key: "input", header: "Input (kg)", render: (row) => row.input_weight_kg },
  { key: "time", header: "Processed At", render: (row) => formatDateTime(row.processed_at) },
];

export default function ProcessingRecordsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<"create" | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({
    facility_id: "",
    batch_id: "",
    processed_at: "",
    process_type: "SEGREGATION",
    input_weight_kg: "",
    output_recovered_kg: "",
    output_rejected_kg: "",
    residue_to_landfill_kg: "",
    organic_compost_kg: "",
    recyclable_plastic_kg: "",
    recyclable_metal_kg: "",
    recyclable_paper_kg: "",
    recyclable_glass_kg: "",
    energy_recovered_kwh: "",
    processing_status: "INITIATED",
    notes: "",
  });

  const query = useQuery({ queryKey: queryKeys.processingRecords.list(), queryFn: () => listProcessingRecords() });
  const createMutation = useMutation({
    mutationFn: createProcessingRecord,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.processingRecords.all });
      setMode(null);
      setFormError(null);
    },
  });

  const rows = useMemo(
    () => (query.data ?? []).filter((row) => [row.facility_id, row.batch_id, row.process_type, row.processing_status].join(" ").toLowerCase().includes(search.toLowerCase())),
    [query.data, search],
  );

  function toOptionalNumber(value: string) {
    return value ? Number(value) : undefined;
  }

  function submitCreate() {
    const parsed = schema.safeParse({
      ...form,
      input_weight_kg: Number(form.input_weight_kg),
      output_recovered_kg: toOptionalNumber(form.output_recovered_kg),
      output_rejected_kg: toOptionalNumber(form.output_rejected_kg),
      residue_to_landfill_kg: toOptionalNumber(form.residue_to_landfill_kg),
      organic_compost_kg: toOptionalNumber(form.organic_compost_kg),
      recyclable_plastic_kg: toOptionalNumber(form.recyclable_plastic_kg),
      recyclable_metal_kg: toOptionalNumber(form.recyclable_metal_kg),
      recyclable_paper_kg: toOptionalNumber(form.recyclable_paper_kg),
      recyclable_glass_kg: toOptionalNumber(form.recyclable_glass_kg),
      energy_recovered_kwh: toOptionalNumber(form.energy_recovered_kwh),
    });

    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "Invalid form");
      return;
    }

    createMutation.mutate({
      ...parsed.data,
      output_recovered_kg: parsed.data.output_recovered_kg ?? null,
      output_rejected_kg: parsed.data.output_rejected_kg ?? null,
      residue_to_landfill_kg: parsed.data.residue_to_landfill_kg ?? null,
      organic_compost_kg: parsed.data.organic_compost_kg ?? null,
      recyclable_plastic_kg: parsed.data.recyclable_plastic_kg ?? null,
      recyclable_metal_kg: parsed.data.recyclable_metal_kg ?? null,
      recyclable_paper_kg: parsed.data.recyclable_paper_kg ?? null,
      recyclable_glass_kg: parsed.data.recyclable_glass_kg ?? null,
      energy_recovered_kwh: parsed.data.energy_recovered_kwh ?? null,
      notes: parsed.data.notes || null,
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Processing Records" description="Track material processing outcomes per facility and batch." actions={<Button onClick={() => setMode("create")}>Create Processing Record</Button>} />
      <FilterBar onReset={() => setSearch("")}>
        <Input placeholder="Search processing record" value={search} onChange={(event) => setSearch(event.target.value)} />
      </FilterBar>
      <EntityTable
        columns={columns}
        rows={rows}
        isLoading={query.isLoading}
        isError={query.isError}
        errorMessage={getErrorMessage(query.error)}
        emptyTitle="No processing records found"
        emptyDescription="Create processing records as batches are handled."
        onRetry={() => void query.refetch()}
      />

      <EntityFormDrawer open={mode === "create"} onOpenChange={(open) => !open && setMode(null)} title="Create Processing Record" subtitle="Processing output and residue logging" mode="create" isSubmitting={createMutation.isPending} onSubmit={submitCreate}>
        <FieldGrid>
          <FormTextField label="Facility ID" value={form.facility_id} onChange={(value) => setForm((prev) => ({ ...prev, facility_id: value }))} />
          <FormTextField label="Batch ID" value={form.batch_id} onChange={(value) => setForm((prev) => ({ ...prev, batch_id: value }))} />
          <FormTextField label="Processed At" type="datetime-local" value={form.processed_at} onChange={(value) => setForm((prev) => ({ ...prev, processed_at: value }))} />
          <FormSelectField label="Process Type" value={form.process_type} options={PROCESS_TYPES.map((item) => ({ label: item, value: item }))} onChange={(value) => setForm((prev) => ({ ...prev, process_type: value }))} />
          <FormSelectField label="Processing Status" value={form.processing_status} options={PROCESSING_STATUSES.map((item) => ({ label: item, value: item }))} onChange={(value) => setForm((prev) => ({ ...prev, processing_status: value }))} />
          <FormTextField label="Input Weight (kg)" type="number" value={form.input_weight_kg} onChange={(value) => setForm((prev) => ({ ...prev, input_weight_kg: value }))} />
          <FormTextField label="Recovered (kg)" type="number" value={form.output_recovered_kg} onChange={(value) => setForm((prev) => ({ ...prev, output_recovered_kg: value }))} />
          <FormTextField label="Rejected (kg)" type="number" value={form.output_rejected_kg} onChange={(value) => setForm((prev) => ({ ...prev, output_rejected_kg: value }))} />
          <FormTextField label="Residue to Landfill (kg)" type="number" value={form.residue_to_landfill_kg} onChange={(value) => setForm((prev) => ({ ...prev, residue_to_landfill_kg: value }))} />
          <FormTextField label="Organic Compost (kg)" type="number" value={form.organic_compost_kg} onChange={(value) => setForm((prev) => ({ ...prev, organic_compost_kg: value }))} />
          <FormTextField label="Recyclable Plastic (kg)" type="number" value={form.recyclable_plastic_kg} onChange={(value) => setForm((prev) => ({ ...prev, recyclable_plastic_kg: value }))} />
          <FormTextField label="Recyclable Metal (kg)" type="number" value={form.recyclable_metal_kg} onChange={(value) => setForm((prev) => ({ ...prev, recyclable_metal_kg: value }))} />
          <FormTextField label="Recyclable Paper (kg)" type="number" value={form.recyclable_paper_kg} onChange={(value) => setForm((prev) => ({ ...prev, recyclable_paper_kg: value }))} />
          <FormTextField label="Recyclable Glass (kg)" type="number" value={form.recyclable_glass_kg} onChange={(value) => setForm((prev) => ({ ...prev, recyclable_glass_kg: value }))} />
          <FormTextField label="Energy Recovered (kWh)" type="number" value={form.energy_recovered_kwh} onChange={(value) => setForm((prev) => ({ ...prev, energy_recovered_kwh: value }))} />
        </FieldGrid>
        <FormTextareaField label="Notes" value={form.notes} onChange={(value) => setForm((prev) => ({ ...prev, notes: value }))} />
        {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
        {createMutation.isError ? <p className="text-sm text-red-600">{getErrorMessage(createMutation.error)}</p> : null}
      </EntityFormDrawer>
    </div>
  );
}
