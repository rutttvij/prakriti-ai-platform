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
import { PICKUP_EVENT_TYPES } from "@/lib/constants";
import { getErrorMessage } from "@/lib/api/query-utils";
import { createPickupLog, listPickupLogs } from "@/lib/api/services";
import { formatDateTime } from "@/lib/utils";
import { queryKeys } from "@/types/query-keys";
import type { ColumnDef } from "@/types/table";
import type { PickupLog } from "@/types/domain";

const schema = z.object({
  pickup_task_id: z.string().uuid(),
  worker_profile_id: z.string().uuid(),
  event_type: z.string().min(1),
  event_at: z.string().optional(),
  notes: z.string().optional(),
  weight_kg: z.coerce.number().nonnegative().optional(),
  photo_url: z.string().url().optional().or(z.literal("")),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
});

const columns: ColumnDef<PickupLog>[] = [
  { key: "event", header: "Event", render: (row) => <StatusBadge value={row.event_type} /> },
  { key: "task", header: "Pickup Task", render: (row) => row.pickup_task_id },
  { key: "worker", header: "Worker", render: (row) => row.worker_profile_id },
  { key: "time", header: "Event Time", render: (row) => formatDateTime(row.event_at) },
  { key: "weight", header: "Weight (kg)", render: (row) => row.weight_kg ?? "-" },
  { key: "photo", header: "Photo", render: (row) => (row.photo_url ? <a href={row.photo_url} target="_blank" rel="noreferrer" className="text-emerald-700 underline">Open</a> : "-") },
];

export default function PickupLogsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<"create" | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({
    pickup_task_id: "",
    worker_profile_id: "",
    event_type: "TASK_CREATED",
    event_at: "",
    notes: "",
    weight_kg: "",
    photo_url: "",
    latitude: "",
    longitude: "",
  });

  const query = useQuery({ queryKey: queryKeys.pickupLogs.list(), queryFn: () => listPickupLogs() });
  const createMutation = useMutation({
    mutationFn: createPickupLog,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.pickupLogs.all });
      setMode(null);
      setFormError(null);
    },
  });

  const rows = useMemo(
    () => (query.data ?? []).filter((row) => [row.event_type, row.pickup_task_id, row.worker_profile_id].join(" ").toLowerCase().includes(search.toLowerCase())),
    [query.data, search],
  );

  function submitCreate() {
    const parsed = schema.safeParse({ ...form, weight_kg: form.weight_kg ? Number(form.weight_kg) : undefined });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "Invalid form");
      return;
    }
    createMutation.mutate({
      ...parsed.data,
      event_at: parsed.data.event_at || null,
      notes: parsed.data.notes || null,
      weight_kg: parsed.data.weight_kg ?? null,
      photo_url: parsed.data.photo_url || null,
      latitude: parsed.data.latitude || null,
      longitude: parsed.data.longitude || null,
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Pickup Logs" description="Operational event logs generated during pickup lifecycle." actions={<Button onClick={() => setMode("create")}>Create Pickup Log</Button>} />
      <FilterBar onReset={() => setSearch("")}>
        <Input placeholder="Search event, task, worker" value={search} onChange={(event) => setSearch(event.target.value)} />
      </FilterBar>
      <EntityTable
        columns={columns}
        rows={rows}
        isLoading={query.isLoading}
        isError={query.isError}
        errorMessage={getErrorMessage(query.error)}
        emptyTitle="No pickup logs found"
        emptyDescription="Logs will appear as pickup tasks progress."
        onRetry={() => void query.refetch()}
      />

      <EntityFormDrawer
        open={mode === "create"}
        onOpenChange={(open) => !open && setMode(null)}
        title="Create Pickup Log"
        subtitle="Manual event entry for operations review"
        mode="create"
        isSubmitting={createMutation.isPending}
        onSubmit={submitCreate}
      >
        <FieldGrid>
          <FormTextField label="Pickup Task ID" value={form.pickup_task_id} onChange={(value) => setForm((prev) => ({ ...prev, pickup_task_id: value }))} />
          <FormTextField label="Worker Profile ID" value={form.worker_profile_id} onChange={(value) => setForm((prev) => ({ ...prev, worker_profile_id: value }))} />
          <FormSelectField label="Event Type" value={form.event_type} options={PICKUP_EVENT_TYPES.map((item) => ({ label: item, value: item }))} onChange={(value) => setForm((prev) => ({ ...prev, event_type: value }))} />
          <FormTextField label="Event At" type="datetime-local" value={form.event_at} onChange={(value) => setForm((prev) => ({ ...prev, event_at: value }))} />
          <FormTextField label="Weight (kg)" type="number" value={form.weight_kg} onChange={(value) => setForm((prev) => ({ ...prev, weight_kg: value }))} />
          <FormTextField label="Photo URL" value={form.photo_url} onChange={(value) => setForm((prev) => ({ ...prev, photo_url: value }))} />
          <FormTextField label="Latitude" value={form.latitude} onChange={(value) => setForm((prev) => ({ ...prev, latitude: value }))} />
          <FormTextField label="Longitude" value={form.longitude} onChange={(value) => setForm((prev) => ({ ...prev, longitude: value }))} />
        </FieldGrid>
        <FormTextareaField label="Notes" value={form.notes} onChange={(value) => setForm((prev) => ({ ...prev, notes: value }))} />
        {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
        {createMutation.isError ? <p className="text-sm text-red-600">{getErrorMessage(createMutation.error)}</p> : null}
      </EntityFormDrawer>
    </div>
  );
}
