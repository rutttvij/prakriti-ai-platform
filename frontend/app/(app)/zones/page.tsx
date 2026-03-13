"use client";

import { useMemo, useState } from "react";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { EntityDetailsCard } from "@/components/crud/entity-details-card";
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
import { createZone, listZones } from "@/lib/api/services";
import { formatDate } from "@/lib/utils";
import { queryKeys } from "@/types/query-keys";
import type { Zone } from "@/types/domain";
import type { ColumnDef } from "@/types/table";

const schema = z.object({ ward_id: z.string().uuid(), name: z.string().min(2), code: z.string().min(1), is_active: z.boolean() });

const columns: ColumnDef<Zone>[] = [
  { key: "name", header: "Zone", render: (row) => row.name },
  { key: "code", header: "Code", render: (row) => row.code },
  { key: "ward", header: "Ward ID", render: (row) => row.ward_id },
  { key: "status", header: "Status", render: (row) => <StatusBadge value={row.is_active ? "ACTIVE" : "INACTIVE"} /> },
  { key: "updated", header: "Updated", render: (row) => formatDate(row.updated_at) },
];

export default function ZonesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<"create" | "view" | "edit" | null>(null);
  const [selected, setSelected] = useState<Zone | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({ ward_id: "", name: "", code: "", is_active: true });

  const query = useQuery({ queryKey: queryKeys.zones.list(), queryFn: () => listZones() });
  const createMutation = useMutation({ mutationFn: createZone, onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: queryKeys.zones.all }); setMode(null); setForm({ ward_id: "", name: "", code: "", is_active: true }); setFormError(null); } });

  const rows = useMemo(() => (query.data ?? []).filter((row) => [row.name, row.code].join(" ").toLowerCase().includes(search.toLowerCase())), [query.data, search]);

  function submitCreate() {
    const parsed = schema.safeParse(form);
    if (!parsed.success) { setFormError(parsed.error.issues[0]?.message ?? "Invalid form"); return; }
    createMutation.mutate(parsed.data);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Zones" description="Operational zones within wards." actions={<Button onClick={() => setMode("create")}>Create Zone</Button>} />
      <FilterBar onReset={() => setSearch("")}><Input placeholder="Search zone" value={search} onChange={(event) => setSearch(event.target.value)} /></FilterBar>
      <EntityTable columns={columns} rows={rows} isLoading={query.isLoading} isError={query.isError} errorMessage={getErrorMessage(query.error)} emptyTitle="No zones found" emptyDescription="Create a zone to get started." onRetry={() => void query.refetch()} rowActions={(row) => <RowActions row={row} onView={(item) => { setSelected(item); setMode("view"); }} onEdit={(item) => { setSelected(item); setMode("edit"); }} />} />
      <EntityFormDrawer open={mode === "create" || mode === "edit"} onOpenChange={(open) => !open && setMode(null)} title={mode === "create" ? "Create Zone" : `Edit ${selected?.name ?? "Zone"}`} subtitle="Zone profile" mode={mode === "edit" ? "edit" : "create"} isSubmitting={createMutation.isPending} onSubmit={submitCreate}>
        <FieldGrid>
          <FormTextField label="Ward ID" value={mode === "edit" ? selected?.ward_id ?? "" : form.ward_id} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, ward_id: value }))} />
          <FormTextField label="Zone Name" value={mode === "edit" ? selected?.name ?? "" : form.name} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, name: value }))} />
          <FormTextField label="Zone Code" value={mode === "edit" ? selected?.code ?? "" : form.code} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, code: value }))} />
          <FormSelectField label="Status" value={String(mode === "edit" ? selected?.is_active ?? false : form.is_active)} disabled={mode === "edit"} options={BOOLEAN_OPTIONS} onChange={(value) => setForm((prev) => ({ ...prev, is_active: value === "true" }))} />
        </FieldGrid>
        {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
        {createMutation.isError ? <p className="text-sm text-red-600">{getErrorMessage(createMutation.error)}</p> : null}
      </EntityFormDrawer>
      <EntityFormDrawer open={mode === "view"} onOpenChange={(open) => !open && setMode(null)} title={selected?.name ?? "Zone"} subtitle="Zone details" mode="edit">
        {selected ? <EntityDetailsCard title="Summary" items={[{ label: "ID", value: selected.id }, { label: "Ward", value: selected.ward_id }, { label: "Name", value: selected.name }, { label: "Code", value: selected.code }, { label: "Status", value: <StatusBadge value={selected.is_active ? "ACTIVE" : "INACTIVE"} /> }, { label: "Updated", value: formatDate(selected.updated_at) }]} /> : null}
      </EntityFormDrawer>
    </div>
  );
}
