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
import { createCity, listCities } from "@/lib/api/services";
import { formatDate } from "@/lib/utils";
import { queryKeys } from "@/types/query-keys";
import type { City } from "@/types/domain";
import type { ColumnDef } from "@/types/table";

const schema = z.object({
  organization_id: z.string().uuid(),
  name: z.string().min(2),
  state: z.string().min(2),
  country: z.string().min(2),
  is_active: z.boolean(),
});

const columns: ColumnDef<City>[] = [
  { key: "name", header: "City", render: (row) => row.name },
  { key: "state", header: "State", render: (row) => row.state },
  { key: "country", header: "Country", render: (row) => row.country },
  { key: "org", header: "Organization", render: (row) => row.organization_id },
  { key: "status", header: "Status", render: (row) => <StatusBadge value={row.is_active ? "ACTIVE" : "INACTIVE"} /> },
  { key: "updated", header: "Updated", render: (row) => formatDate(row.updated_at) },
];

export default function CitiesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<"create" | "view" | "edit" | null>(null);
  const [selected, setSelected] = useState<City | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({ organization_id: "", name: "", state: "", country: "", is_active: true });

  const query = useQuery({ queryKey: queryKeys.cities.list(), queryFn: () => listCities() });
  const createMutation = useMutation({
    mutationFn: createCity,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.cities.all });
      setMode(null);
      setForm({ organization_id: "", name: "", state: "", country: "", is_active: true });
      setFormError(null);
    },
  });

  const rows = useMemo(() => (query.data ?? []).filter((row) => [row.name, row.state, row.country].join(" ").toLowerCase().includes(search.toLowerCase())), [query.data, search]);

  function submitCreate() {
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "Invalid form");
      return;
    }
    createMutation.mutate(parsed.data);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Cities" description="Manage city hierarchy under organizations." actions={<Button onClick={() => setMode("create")}>Create City</Button>} />

      <FilterBar onReset={() => setSearch("")}>
        <Input placeholder="Search city/state/country" value={search} onChange={(event) => setSearch(event.target.value)} />
      </FilterBar>

      <EntityTable columns={columns} rows={rows} isLoading={query.isLoading} isError={query.isError} errorMessage={getErrorMessage(query.error)} emptyTitle="No cities found" emptyDescription="Create a city to get started." onRetry={() => void query.refetch()} rowActions={(row) => <RowActions row={row} onView={(item) => { setSelected(item); setMode("view"); }} onEdit={(item) => { setSelected(item); setMode("edit"); }} />} />

      <EntityFormDrawer open={mode === "create" || mode === "edit"} onOpenChange={(open) => !open && setMode(null)} title={mode === "create" ? "Create City" : `Edit ${selected?.name ?? "City"}`} subtitle="City profile" mode={mode === "edit" ? "edit" : "create"} isSubmitting={createMutation.isPending} onSubmit={submitCreate}>
        <FieldGrid>
          <FormTextField label="Organization ID" value={mode === "edit" ? selected?.organization_id ?? "" : form.organization_id} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, organization_id: value }))} />
          <FormTextField label="City Name" value={mode === "edit" ? selected?.name ?? "" : form.name} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, name: value }))} />
          <FormTextField label="State" value={mode === "edit" ? selected?.state ?? "" : form.state} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, state: value }))} />
          <FormTextField label="Country" value={mode === "edit" ? selected?.country ?? "" : form.country} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, country: value }))} />
          <FormSelectField label="Status" value={String(mode === "edit" ? selected?.is_active ?? false : form.is_active)} disabled={mode === "edit"} options={BOOLEAN_OPTIONS} onChange={(value) => setForm((prev) => ({ ...prev, is_active: value === "true" }))} />
        </FieldGrid>
        {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
        {createMutation.isError ? <p className="text-sm text-red-600">{getErrorMessage(createMutation.error)}</p> : null}
      </EntityFormDrawer>

      <EntityFormDrawer open={mode === "view"} onOpenChange={(open) => !open && setMode(null)} title={selected?.name ?? "City"} subtitle="City details" mode="edit">
        {selected ? <EntityDetailsCard title="Summary" items={[{ label: "ID", value: selected.id }, { label: "Organization", value: selected.organization_id }, { label: "Name", value: selected.name }, { label: "State", value: selected.state }, { label: "Country", value: selected.country }, { label: "Status", value: <StatusBadge value={selected.is_active ? "ACTIVE" : "INACTIVE"} /> }, { label: "Updated", value: formatDate(selected.updated_at) }]} /> : null}
      </EntityFormDrawer>
    </div>
  );
}
