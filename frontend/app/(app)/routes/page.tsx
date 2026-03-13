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
import { BOOLEAN_OPTIONS, ROUTE_TYPES } from "@/lib/constants";
import { getErrorMessage } from "@/lib/api/query-utils";
import { createRoute, listRoutes } from "@/lib/api/services";
import { formatDate } from "@/lib/utils";
import { queryKeys } from "@/types/query-keys";
import type { ColumnDef } from "@/types/table";
import type { Route } from "@/types/domain";

const schema = z.object({ city_id: z.string().uuid(), ward_id: z.string().uuid(), zone_id: z.string().uuid().optional().or(z.literal("")), route_code: z.string().min(2), name: z.string().min(2), route_type: z.string().min(1), is_active: z.boolean() });

const columns: ColumnDef<Route>[] = [
  { key: "code", header: "Route Code", render: (row) => row.route_code },
  { key: "name", header: "Name", render: (row) => row.name },
  { key: "type", header: "Type", render: (row) => <StatusBadge value={row.route_type} /> },
  { key: "ward", header: "Ward ID", render: (row) => row.ward_id },
  { key: "active", header: "Active", render: (row) => <StatusBadge value={row.is_active ? "ACTIVE" : "INACTIVE"} /> },
  { key: "updated", header: "Updated", render: (row) => formatDate(row.updated_at) },
];

export default function RoutesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<"create" | "edit" | null>(null);
  const [selected, setSelected] = useState<Route | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({ city_id: "", ward_id: "", zone_id: "", route_code: "", name: "", route_type: "DOOR_TO_DOOR", is_active: true });

  const query = useQuery({ queryKey: queryKeys.routes.list(), queryFn: () => listRoutes() });
  const createMutation = useMutation({ mutationFn: createRoute, onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: queryKeys.routes.all }); setMode(null); setFormError(null); } });

  const rows = useMemo(() => (query.data ?? []).filter((row) => [row.route_code, row.name].join(" ").toLowerCase().includes(search.toLowerCase())), [query.data, search]);

  function submitCreate() {
    const parsed = schema.safeParse(form);
    if (!parsed.success) { setFormError(parsed.error.issues[0]?.message ?? "Invalid form"); return; }
    createMutation.mutate({ ...parsed.data, zone_id: parsed.data.zone_id || null });
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Routes" description="Operational collection routes." actions={<Button onClick={() => setMode("create")}>Create Route</Button>} />
      <FilterBar onReset={() => setSearch("")}><Input placeholder="Search route" value={search} onChange={(event) => setSearch(event.target.value)} /></FilterBar>
      <EntityTable columns={columns} rows={rows} isLoading={query.isLoading} isError={query.isError} errorMessage={getErrorMessage(query.error)} emptyTitle="No routes found" emptyDescription="Create a route to get started." onRetry={() => void query.refetch()} rowActions={(row) => <RowActions row={row} viewHref={`/routes/${row.id}`} onEdit={(item) => { setSelected(item); setMode("edit"); }} />} />
      <EntityFormDrawer open={mode === "create" || mode === "edit"} onOpenChange={(open) => !open && setMode(null)} title={mode === "create" ? "Create Route" : `Edit ${selected?.route_code ?? "Route"}`} subtitle="Route profile" mode={mode === "edit" ? "edit" : "create"} isSubmitting={createMutation.isPending} onSubmit={submitCreate}>
        <FieldGrid>
          <FormTextField label="City ID" value={mode === "edit" ? selected?.city_id ?? "" : form.city_id} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, city_id: value }))} />
          <FormTextField label="Ward ID" value={mode === "edit" ? selected?.ward_id ?? "" : form.ward_id} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, ward_id: value }))} />
          <FormTextField label="Zone ID" value={mode === "edit" ? selected?.zone_id ?? "" : form.zone_id} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, zone_id: value }))} />
          <FormTextField label="Route Code" value={mode === "edit" ? selected?.route_code ?? "" : form.route_code} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, route_code: value }))} />
          <FormTextField label="Route Name" value={mode === "edit" ? selected?.name ?? "" : form.name} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, name: value }))} />
          <FormSelectField label="Route Type" value={mode === "edit" ? selected?.route_type ?? "DOOR_TO_DOOR" : form.route_type} disabled={mode === "edit"} options={ROUTE_TYPES.map((item) => ({ label: item, value: item }))} onChange={(value) => setForm((prev) => ({ ...prev, route_type: value }))} />
          <FormSelectField label="Active" value={String(mode === "edit" ? selected?.is_active ?? false : form.is_active)} disabled={mode === "edit"} options={BOOLEAN_OPTIONS} onChange={(value) => setForm((prev) => ({ ...prev, is_active: value === "true" }))} />
        </FieldGrid>
        {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
        {createMutation.isError ? <p className="text-sm text-red-600">{getErrorMessage(createMutation.error)}</p> : null}
      </EntityFormDrawer>
    </div>
  );
}
