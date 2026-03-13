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
import { BOOLEAN_OPTIONS, EMPLOYMENT_STATUSES } from "@/lib/constants";
import { getErrorMessage } from "@/lib/api/query-utils";
import { createWorker, listWorkers } from "@/lib/api/services";
import { formatDate } from "@/lib/utils";
import { queryKeys } from "@/types/query-keys";
import type { ColumnDef } from "@/types/table";
import type { Worker } from "@/types/domain";

const schema = z.object({ user_id: z.string().uuid(), employee_code: z.string().min(2), city_id: z.string().uuid(), ward_id: z.string().uuid().optional().or(z.literal("")), zone_id: z.string().uuid().optional().or(z.literal("")), designation: z.string().min(2), employment_status: z.string().min(1), joined_on: z.string().optional(), is_active: z.boolean() });

const columns: ColumnDef<Worker>[] = [
  { key: "code", header: "Employee Code", render: (row) => row.employee_code },
  { key: "designation", header: "Designation", render: (row) => row.designation },
  { key: "status", header: "Employment", render: (row) => <StatusBadge value={row.employment_status} /> },
  { key: "joined", header: "Joined", render: (row) => formatDate(row.joined_on) },
  { key: "active", header: "Active", render: (row) => <StatusBadge value={row.is_active ? "ACTIVE" : "INACTIVE"} /> },
  { key: "updated", header: "Updated", render: (row) => formatDate(row.updated_at) },
];

export default function WorkersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<"create" | "edit" | null>(null);
  const [selected, setSelected] = useState<Worker | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({ user_id: "", employee_code: "", city_id: "", ward_id: "", zone_id: "", designation: "", employment_status: "ACTIVE", joined_on: "", is_active: true });

  const query = useQuery({ queryKey: queryKeys.workers.list(), queryFn: () => listWorkers() });
  const createMutation = useMutation({ mutationFn: createWorker, onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: queryKeys.workers.all }); setMode(null); setFormError(null); } });

  const rows = useMemo(() => (query.data ?? []).filter((row) => [row.employee_code, row.designation].join(" ").toLowerCase().includes(search.toLowerCase())), [query.data, search]);

  function submitCreate() {
    const parsed = schema.safeParse(form);
    if (!parsed.success) { setFormError(parsed.error.issues[0]?.message ?? "Invalid form"); return; }
    createMutation.mutate({ ...parsed.data, ward_id: parsed.data.ward_id || null, zone_id: parsed.data.zone_id || null, joined_on: parsed.data.joined_on || null });
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Workers" description="Workforce profiles and assignments." actions={<Button onClick={() => setMode("create")}>Create Worker</Button>} />
      <FilterBar onReset={() => setSearch("")}><Input placeholder="Search worker" value={search} onChange={(event) => setSearch(event.target.value)} /></FilterBar>
      <EntityTable columns={columns} rows={rows} isLoading={query.isLoading} isError={query.isError} errorMessage={getErrorMessage(query.error)} emptyTitle="No workers found" emptyDescription="Create a worker profile to get started." onRetry={() => void query.refetch()} rowActions={(row) => <RowActions row={row} viewHref={`/workers/${row.id}`} onEdit={(item) => { setSelected(item); setMode("edit"); }} />} />
      <EntityFormDrawer open={mode === "create" || mode === "edit"} onOpenChange={(open) => !open && setMode(null)} title={mode === "create" ? "Create Worker" : `Edit ${selected?.employee_code ?? "Worker"}`} subtitle="Worker profile" mode={mode === "edit" ? "edit" : "create"} isSubmitting={createMutation.isPending} onSubmit={submitCreate}>
        <FieldGrid>
          <FormTextField label="User ID" value={mode === "edit" ? selected?.user_id ?? "" : form.user_id} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, user_id: value }))} />
          <FormTextField label="Employee Code" value={mode === "edit" ? selected?.employee_code ?? "" : form.employee_code} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, employee_code: value }))} />
          <FormTextField label="City ID" value={mode === "edit" ? selected?.city_id ?? "" : form.city_id} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, city_id: value }))} />
          <FormTextField label="Ward ID" value={mode === "edit" ? selected?.ward_id ?? "" : form.ward_id} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, ward_id: value }))} />
          <FormTextField label="Zone ID" value={mode === "edit" ? selected?.zone_id ?? "" : form.zone_id} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, zone_id: value }))} />
          <FormTextField label="Designation" value={mode === "edit" ? selected?.designation ?? "" : form.designation} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, designation: value }))} />
          <FormSelectField label="Employment Status" value={mode === "edit" ? selected?.employment_status ?? "ACTIVE" : form.employment_status} disabled={mode === "edit"} options={EMPLOYMENT_STATUSES.map((item) => ({ label: item, value: item }))} onChange={(value) => setForm((prev) => ({ ...prev, employment_status: value }))} />
          <FormTextField label="Joined On" type="date" value={mode === "edit" ? selected?.joined_on ?? "" : form.joined_on} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, joined_on: value }))} />
          <FormSelectField label="Active" value={String(mode === "edit" ? selected?.is_active ?? false : form.is_active)} disabled={mode === "edit"} options={BOOLEAN_OPTIONS} onChange={(value) => setForm((prev) => ({ ...prev, is_active: value === "true" }))} />
        </FieldGrid>
        {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
        {createMutation.isError ? <p className="text-sm text-red-600">{getErrorMessage(createMutation.error)}</p> : null}
      </EntityFormDrawer>
    </div>
  );
}
