"use client";

import { useMemo, useState } from "react";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { EntityFormDrawer } from "@/components/crud/entity-form-drawer";
import { EntityTable } from "@/components/crud/entity-table";
import { FieldGrid } from "@/components/crud/field-grid";
import { RowActions } from "@/components/crud/row-actions";
import { FormSelectField, FormTextField } from "@/components/forms/form-fields";
import { Button } from "@/components/ui/button";
import { FilterBar } from "@/components/ui-extensions/filter-bar";
import { PageHeader } from "@/components/ui-extensions/page-header";
import { StatusBadge } from "@/components/ui-extensions/status-badge";
import { Input } from "@/components/ui/input";
import { BOOLEAN_OPTIONS } from "@/lib/constants";
import { getErrorMessage } from "@/lib/api/query-utils";
import { createShift, listShifts } from "@/lib/api/services";
import { formatDate } from "@/lib/utils";
import { queryKeys } from "@/types/query-keys";
import type { ColumnDef } from "@/types/table";
import type { Shift } from "@/types/domain";

const schema = z.object({
  city_id: z.string().uuid(),
  ward_id: z.string().uuid().optional().or(z.literal("")),
  zone_id: z.string().uuid().optional().or(z.literal("")),
  name: z.string().min(2),
  shift_date: z.string().min(1),
  start_time: z.string().min(1),
  end_time: z.string().min(1),
  supervisor_user_id: z.string().uuid().optional().or(z.literal("")),
  is_active: z.boolean(),
});

const columns: ColumnDef<Shift>[] = [
  { key: "name", header: "Shift", render: (row) => row.name },
  { key: "date", header: "Date", render: (row) => formatDate(row.shift_date) },
  { key: "time", header: "Window", render: (row) => `${row.start_time} - ${row.end_time}` },
  { key: "supervisor", header: "Supervisor", render: (row) => row.supervisor_user_id ?? "-" },
  { key: "status", header: "Status", render: (row) => <StatusBadge value={row.is_active ? "ACTIVE" : "INACTIVE"} /> },
];

export default function ShiftsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<"create" | "edit" | null>(null);
  const [selected, setSelected] = useState<Shift | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({
    city_id: "",
    ward_id: "",
    zone_id: "",
    name: "",
    shift_date: "",
    start_time: "",
    end_time: "",
    supervisor_user_id: "",
    is_active: true,
  });

  const query = useQuery({ queryKey: queryKeys.shifts.list(), queryFn: () => listShifts() });
  const createMutation = useMutation({
    mutationFn: createShift,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.shifts.all });
      setMode(null);
      setFormError(null);
    },
  });

  const rows = useMemo(
    () =>
      (query.data ?? []).filter((row) =>
        [row.name, row.shift_date, row.supervisor_user_id ?? ""].join(" ").toLowerCase().includes(search.toLowerCase()),
      ),
    [query.data, search],
  );

  function submitCreate() {
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "Invalid form");
      return;
    }
    createMutation.mutate({
      ...parsed.data,
      ward_id: parsed.data.ward_id || null,
      zone_id: parsed.data.zone_id || null,
      supervisor_user_id: parsed.data.supervisor_user_id || null,
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Shifts" description="Manage daily operational shifts and assignments." actions={<Button onClick={() => setMode("create")}>Create Shift</Button>} />
      <FilterBar onReset={() => setSearch("")}>
        <Input placeholder="Search shift" value={search} onChange={(event) => setSearch(event.target.value)} />
      </FilterBar>
      <EntityTable
        columns={columns}
        rows={rows}
        isLoading={query.isLoading}
        isError={query.isError}
        errorMessage={getErrorMessage(query.error)}
        emptyTitle="No shifts found"
        emptyDescription="Create a shift to begin daily operations planning."
        onRetry={() => void query.refetch()}
        rowActions={(row) => <RowActions row={row} viewHref={`/shifts/${row.id}`} onEdit={(item) => { setSelected(item); setMode("edit"); }} />}
      />

      <EntityFormDrawer
        open={mode === "create" || mode === "edit"}
        onOpenChange={(open) => !open && setMode(null)}
        title={mode === "create" ? "Create Shift" : `Edit ${selected?.name ?? "Shift"}`}
        subtitle="Shift timing and supervision scope"
        mode={mode === "edit" ? "edit" : "create"}
        isSubmitting={createMutation.isPending}
        onSubmit={submitCreate}
      >
        <FieldGrid>
          <FormTextField label="City ID" value={mode === "edit" ? selected?.city_id ?? "" : form.city_id} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, city_id: value }))} />
          <FormTextField label="Ward ID" value={mode === "edit" ? selected?.ward_id ?? "" : form.ward_id} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, ward_id: value }))} />
          <FormTextField label="Zone ID" value={mode === "edit" ? selected?.zone_id ?? "" : form.zone_id} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, zone_id: value }))} />
          <FormTextField label="Shift Name" value={mode === "edit" ? selected?.name ?? "" : form.name} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, name: value }))} />
          <FormTextField label="Shift Date" type="date" value={mode === "edit" ? selected?.shift_date ?? "" : form.shift_date} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, shift_date: value }))} />
          <FormTextField label="Start Time" type="time" value={mode === "edit" ? selected?.start_time ?? "" : form.start_time} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, start_time: value }))} />
          <FormTextField label="End Time" type="time" value={mode === "edit" ? selected?.end_time ?? "" : form.end_time} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, end_time: value }))} />
          <FormTextField label="Supervisor User ID" value={mode === "edit" ? selected?.supervisor_user_id ?? "" : form.supervisor_user_id} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, supervisor_user_id: value }))} />
          <FormSelectField label="Active" value={String(mode === "edit" ? selected?.is_active ?? false : form.is_active)} disabled={mode === "edit"} options={BOOLEAN_OPTIONS} onChange={(value) => setForm((prev) => ({ ...prev, is_active: value === "true" }))} />
        </FieldGrid>
        {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
        {createMutation.isError ? <p className="text-sm text-red-600">{getErrorMessage(createMutation.error)}</p> : null}
      </EntityFormDrawer>
    </div>
  );
}
