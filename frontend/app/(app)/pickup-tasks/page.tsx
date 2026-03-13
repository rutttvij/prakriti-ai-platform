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
import { BOOLEAN_OPTIONS, PICKUP_STATUSES, SOURCE_TYPES, WASTE_CATEGORIES } from "@/lib/constants";
import { getErrorMessage } from "@/lib/api/query-utils";
import { createPickupTask, listPickupTasks } from "@/lib/api/services";
import { formatDate } from "@/lib/utils";
import { queryKeys } from "@/types/query-keys";
import type { ColumnDef } from "@/types/table";
import type { PickupTask } from "@/types/domain";

const schema = z.object({
  city_id: z.string().uuid(),
  ward_id: z.string().uuid(),
  zone_id: z.string().uuid().optional().or(z.literal("")),
  route_id: z.string().uuid().optional().or(z.literal("")),
  source_type: z.string().min(1),
  household_id: z.string().uuid().optional().or(z.literal("")),
  bulk_generator_id: z.string().uuid().optional().or(z.literal("")),
  assigned_worker_id: z.string().uuid().optional().or(z.literal("")),
  assigned_vehicle_id: z.string().uuid().optional().or(z.literal("")),
  scheduled_date: z.string().min(1),
  scheduled_time_window_start: z.string().optional(),
  scheduled_time_window_end: z.string().optional(),
  pickup_status: z.string().min(1),
  waste_category: z.string().optional(),
  expected_weight_kg: z.coerce.number().nonnegative().optional(),
  notes: z.string().optional(),
  contamination_flag: z.boolean(),
  is_active: z.boolean(),
}).refine((data) => (data.source_type === "HOUSEHOLD" ? Boolean(data.household_id) : true), { message: "household_id is required for HOUSEHOLD", path: ["household_id"] })
  .refine((data) => (data.source_type === "BULK_GENERATOR" ? Boolean(data.bulk_generator_id) : true), { message: "bulk_generator_id is required for BULK_GENERATOR", path: ["bulk_generator_id"] });

const columns: ColumnDef<PickupTask>[] = [
  { key: "id", header: "Task ID", render: (row) => row.id },
  { key: "source", header: "Source", render: (row) => <StatusBadge value={row.source_type} /> },
  { key: "status", header: "Status", render: (row) => <StatusBadge value={row.pickup_status} /> },
  { key: "date", header: "Scheduled", render: (row) => formatDate(row.scheduled_date) },
  { key: "expected", header: "Expected (kg)", render: (row) => row.expected_weight_kg ?? "-" },
  { key: "actual", header: "Actual (kg)", render: (row) => row.actual_weight_kg ?? "-" },
];

export default function PickupTasksPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [pickupStatus, setPickupStatus] = useState("all");
  const [sourceType, setSourceType] = useState("all");
  const [mode, setMode] = useState<"create" | "edit" | null>(null);
  const [selected, setSelected] = useState<PickupTask | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({ city_id: "", ward_id: "", zone_id: "", route_id: "", source_type: "HOUSEHOLD", household_id: "", bulk_generator_id: "", assigned_worker_id: "", assigned_vehicle_id: "", scheduled_date: "", scheduled_time_window_start: "", scheduled_time_window_end: "", pickup_status: "PENDING", waste_category: "", expected_weight_kg: "", notes: "", contamination_flag: false, is_active: true });

  const params = useMemo(() => ({ pickup_status: pickupStatus === "all" ? undefined : pickupStatus, source_type: sourceType === "all" ? undefined : sourceType }), [pickupStatus, sourceType]);
  const query = useQuery({ queryKey: queryKeys.pickupTasks.list(params), queryFn: () => listPickupTasks(params) });

  const createMutation = useMutation({ mutationFn: createPickupTask, onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: queryKeys.pickupTasks.all }); setMode(null); setFormError(null); } });

  const rows = useMemo(() => (query.data ?? []).filter((row) => [row.id, row.source_type, row.pickup_status, row.route_id ?? ""].join(" ").toLowerCase().includes(search.toLowerCase())), [query.data, search]);

  function submitCreate() {
    const parsed = schema.safeParse({ ...form, expected_weight_kg: form.expected_weight_kg ? Number(form.expected_weight_kg) : undefined });
    if (!parsed.success) { setFormError(parsed.error.issues[0]?.message ?? "Invalid form"); return; }
    createMutation.mutate({ ...parsed.data, zone_id: parsed.data.zone_id || null, route_id: parsed.data.route_id || null, household_id: parsed.data.household_id || null, bulk_generator_id: parsed.data.bulk_generator_id || null, assigned_worker_id: parsed.data.assigned_worker_id || null, assigned_vehicle_id: parsed.data.assigned_vehicle_id || null, scheduled_time_window_start: parsed.data.scheduled_time_window_start || null, scheduled_time_window_end: parsed.data.scheduled_time_window_end || null, waste_category: parsed.data.waste_category || null, expected_weight_kg: parsed.data.expected_weight_kg ?? null, notes: parsed.data.notes || null });
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Pickup Tasks" description="Schedule and monitor pickup operations." actions={<Button onClick={() => setMode("create")}>Create Pickup Task</Button>} />
      <FilterBar onReset={() => { setSearch(""); setPickupStatus("all"); setSourceType("all"); }}>
        <Input placeholder="Search pickup task" value={search} onChange={(event) => setSearch(event.target.value)} />
        <FormSelectField label="Pickup Status" value={pickupStatus} options={[{ label: "All", value: "all" }, ...PICKUP_STATUSES.map((item) => ({ label: item, value: item }))]} onChange={setPickupStatus} />
        <FormSelectField label="Source Type" value={sourceType} options={[{ label: "All", value: "all" }, ...SOURCE_TYPES.map((item) => ({ label: item, value: item }))]} onChange={setSourceType} />
      </FilterBar>

      <EntityTable columns={columns} rows={rows} isLoading={query.isLoading} isError={query.isError} errorMessage={getErrorMessage(query.error)} emptyTitle="No pickup tasks found" emptyDescription="Create pickup tasks to start operations." onRetry={() => void query.refetch()} rowActions={(row) => <RowActions row={row} viewHref={`/pickup-tasks/${row.id}`} onEdit={(item) => { setSelected(item); setMode("edit"); }} />} />

      <EntityFormDrawer open={mode === "create" || mode === "edit"} onOpenChange={(open) => !open && setMode(null)} title={mode === "create" ? "Create Pickup Task" : `Edit ${selected?.id ?? "Task"}`} subtitle="Pickup execution profile" mode={mode === "edit" ? "edit" : "create"} isSubmitting={createMutation.isPending} onSubmit={submitCreate}>
        <FieldGrid>
          <FormTextField label="City ID" value={mode === "edit" ? selected?.city_id ?? "" : form.city_id} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, city_id: value }))} />
          <FormTextField label="Ward ID" value={mode === "edit" ? selected?.ward_id ?? "" : form.ward_id} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, ward_id: value }))} />
          <FormTextField label="Zone ID" value={mode === "edit" ? selected?.zone_id ?? "" : form.zone_id} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, zone_id: value }))} />
          <FormTextField label="Route ID" value={mode === "edit" ? selected?.route_id ?? "" : form.route_id} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, route_id: value }))} />
          <FormSelectField label="Source Type" value={mode === "edit" ? selected?.source_type ?? "HOUSEHOLD" : form.source_type} disabled={mode === "edit"} options={SOURCE_TYPES.map((item) => ({ label: item, value: item }))} onChange={(value) => setForm((prev) => ({ ...prev, source_type: value }))} />
          <FormTextField label="Household ID" value={mode === "edit" ? selected?.household_id ?? "" : form.household_id} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, household_id: value }))} />
          <FormTextField label="Bulk Generator ID" value={mode === "edit" ? selected?.bulk_generator_id ?? "" : form.bulk_generator_id} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, bulk_generator_id: value }))} />
          <FormTextField label="Assigned Worker ID" value={mode === "edit" ? selected?.assigned_worker_id ?? "" : form.assigned_worker_id} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, assigned_worker_id: value }))} />
          <FormTextField label="Assigned Vehicle ID" value={mode === "edit" ? selected?.assigned_vehicle_id ?? "" : form.assigned_vehicle_id} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, assigned_vehicle_id: value }))} />
          <FormTextField label="Scheduled Date" type="date" value={mode === "edit" ? selected?.scheduled_date ?? "" : form.scheduled_date} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, scheduled_date: value }))} />
          <FormTextField label="Window Start" type="time" value={mode === "edit" ? selected?.scheduled_time_window_start ?? "" : form.scheduled_time_window_start} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, scheduled_time_window_start: value }))} />
          <FormTextField label="Window End" type="time" value={mode === "edit" ? selected?.scheduled_time_window_end ?? "" : form.scheduled_time_window_end} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, scheduled_time_window_end: value }))} />
          <FormSelectField label="Pickup Status" value={mode === "edit" ? selected?.pickup_status ?? "PENDING" : form.pickup_status} disabled={mode === "edit"} options={PICKUP_STATUSES.map((item) => ({ label: item, value: item }))} onChange={(value) => setForm((prev) => ({ ...prev, pickup_status: value }))} />
          <FormSelectField label="Waste Category" value={mode === "edit" ? selected?.waste_category ?? "WET" : form.waste_category || "WET"} disabled={mode === "edit"} options={WASTE_CATEGORIES.map((item) => ({ label: item, value: item }))} onChange={(value) => setForm((prev) => ({ ...prev, waste_category: value }))} />
          <FormTextField label="Expected Weight (kg)" type="number" value={mode === "edit" ? String(selected?.expected_weight_kg ?? "") : form.expected_weight_kg} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, expected_weight_kg: value }))} />
          <FormSelectField label="Contamination Flag" value={String(mode === "edit" ? selected?.contamination_flag ?? false : form.contamination_flag)} disabled={mode === "edit"} options={BOOLEAN_OPTIONS} onChange={(value) => setForm((prev) => ({ ...prev, contamination_flag: value === "true" }))} />
          <FormSelectField label="Active" value={String(mode === "edit" ? selected?.is_active ?? false : form.is_active)} disabled={mode === "edit"} options={BOOLEAN_OPTIONS} onChange={(value) => setForm((prev) => ({ ...prev, is_active: value === "true" }))} />
        </FieldGrid>
        <FormTextareaField label="Notes" value={mode === "edit" ? selected?.notes ?? "" : form.notes} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, notes: value }))} />
        {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
        {createMutation.isError ? <p className="text-sm text-red-600">{getErrorMessage(createMutation.error)}</p> : null}
      </EntityFormDrawer>
    </div>
  );
}
