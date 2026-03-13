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
import { BOOLEAN_OPTIONS, FACILITY_TYPES } from "@/lib/constants";
import { getErrorMessage } from "@/lib/api/query-utils";
import { createFacility, listFacilities } from "@/lib/api/services";
import { formatDate } from "@/lib/utils";
import { queryKeys } from "@/types/query-keys";
import type { ColumnDef } from "@/types/table";
import type { Facility } from "@/types/domain";

const schema = z.object({
  city_id: z.string().uuid(),
  ward_id: z.string().uuid().optional().or(z.literal("")),
  zone_id: z.string().uuid().optional().or(z.literal("")),
  facility_code: z.string().min(2),
  name: z.string().min(2),
  facility_type: z.string().min(1),
  operator_name: z.string().optional(),
  license_number: z.string().optional(),
  capacity_kg_per_day: z.coerce.number().nonnegative().optional(),
  is_active: z.boolean(),
});

const columns: ColumnDef<Facility>[] = [
  { key: "name", header: "Facility", render: (row) => row.name },
  { key: "code", header: "Code", render: (row) => row.facility_code },
  { key: "type", header: "Type", render: (row) => <StatusBadge value={row.facility_type} /> },
  { key: "operator", header: "Operator", render: (row) => row.operator_name ?? "-" },
  { key: "status", header: "Status", render: (row) => <StatusBadge value={row.is_active ? "ACTIVE" : "INACTIVE"} /> },
  { key: "updated", header: "Updated", render: (row) => formatDate(row.updated_at) },
];

export default function FacilitiesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<"create" | "edit" | null>(null);
  const [selected, setSelected] = useState<Facility | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({ city_id: "", ward_id: "", zone_id: "", facility_code: "", name: "", facility_type: "MRF", operator_name: "", license_number: "", capacity_kg_per_day: "", is_active: true });

  const query = useQuery({ queryKey: queryKeys.facilities.list(), queryFn: () => listFacilities() });
  const createMutation = useMutation({ mutationFn: createFacility, onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: queryKeys.facilities.all }); setMode(null); setFormError(null); } });

  const rows = useMemo(() => (query.data ?? []).filter((row) => [row.name, row.facility_code, row.facility_type].join(" ").toLowerCase().includes(search.toLowerCase())), [query.data, search]);

  function submitCreate() {
    const parsed = schema.safeParse({ ...form, capacity_kg_per_day: form.capacity_kg_per_day ? Number(form.capacity_kg_per_day) : undefined });
    if (!parsed.success) { setFormError(parsed.error.issues[0]?.message ?? "Invalid form"); return; }
    createMutation.mutate({ ...parsed.data, ward_id: parsed.data.ward_id || null, zone_id: parsed.data.zone_id || null, operator_name: parsed.data.operator_name || null, license_number: parsed.data.license_number || null, capacity_kg_per_day: parsed.data.capacity_kg_per_day ?? null });
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Facilities" description="Processing and disposal facility registry." actions={<Button onClick={() => setMode("create")}>Create Facility</Button>} />
      <FilterBar onReset={() => setSearch("")}><Input placeholder="Search facility" value={search} onChange={(event) => setSearch(event.target.value)} /></FilterBar>
      <EntityTable columns={columns} rows={rows} isLoading={query.isLoading} isError={query.isError} errorMessage={getErrorMessage(query.error)} emptyTitle="No facilities found" emptyDescription="Create a facility to get started." onRetry={() => void query.refetch()} rowActions={(row) => <RowActions row={row} viewHref={`/facilities/${row.id}`} onEdit={(item) => { setSelected(item); setMode("edit"); }} />} />

      <EntityFormDrawer open={mode === "create" || mode === "edit"} onOpenChange={(open) => !open && setMode(null)} title={mode === "create" ? "Create Facility" : `Edit ${selected?.name ?? "Facility"}`} subtitle="Facility profile" mode={mode === "edit" ? "edit" : "create"} isSubmitting={createMutation.isPending} onSubmit={submitCreate}>
        <FieldGrid>
          <FormTextField label="City ID" value={mode === "edit" ? selected?.city_id ?? "" : form.city_id} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, city_id: value }))} />
          <FormTextField label="Ward ID" value={mode === "edit" ? selected?.ward_id ?? "" : form.ward_id} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, ward_id: value }))} />
          <FormTextField label="Zone ID" value={mode === "edit" ? selected?.zone_id ?? "" : form.zone_id} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, zone_id: value }))} />
          <FormTextField label="Facility Code" value={mode === "edit" ? selected?.facility_code ?? "" : form.facility_code} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, facility_code: value }))} />
          <FormTextField label="Facility Name" value={mode === "edit" ? selected?.name ?? "" : form.name} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, name: value }))} />
          <FormSelectField label="Facility Type" value={mode === "edit" ? selected?.facility_type ?? "MRF" : form.facility_type} disabled={mode === "edit"} options={FACILITY_TYPES.map((item) => ({ label: item, value: item }))} onChange={(value) => setForm((prev) => ({ ...prev, facility_type: value }))} />
          <FormTextField label="Operator Name" value={mode === "edit" ? selected?.operator_name ?? "" : form.operator_name} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, operator_name: value }))} />
          <FormTextField label="License Number" value={mode === "edit" ? selected?.license_number ?? "" : form.license_number} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, license_number: value }))} />
          <FormTextField label="Capacity (kg/day)" type="number" value={mode === "edit" ? String(selected?.capacity_kg_per_day ?? "") : form.capacity_kg_per_day} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, capacity_kg_per_day: value }))} />
          <FormSelectField label="Status" value={String(mode === "edit" ? selected?.is_active ?? false : form.is_active)} disabled={mode === "edit"} options={BOOLEAN_OPTIONS} onChange={(value) => setForm((prev) => ({ ...prev, is_active: value === "true" }))} />
        </FieldGrid>
        {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
        {createMutation.isError ? <p className="text-sm text-red-600">{getErrorMessage(createMutation.error)}</p> : null}
      </EntityFormDrawer>
    </div>
  );
}
