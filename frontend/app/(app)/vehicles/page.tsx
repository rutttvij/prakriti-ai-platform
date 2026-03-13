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
import { BOOLEAN_OPTIONS, OWNERSHIP_TYPES, VEHICLE_TYPES } from "@/lib/constants";
import { getErrorMessage } from "@/lib/api/query-utils";
import { createVehicle, listVehicles } from "@/lib/api/services";
import { formatDate } from "@/lib/utils";
import { queryKeys } from "@/types/query-keys";
import type { Vehicle } from "@/types/domain";
import type { ColumnDef } from "@/types/table";

const schema = z.object({ city_id: z.string().uuid(), ward_id: z.string().uuid().optional().or(z.literal("")), zone_id: z.string().uuid().optional().or(z.literal("")), registration_number: z.string().min(2), vehicle_type: z.string().min(1), ownership_type: z.string().min(1), capacity_kg: z.coerce.number().nonnegative().optional(), is_active: z.boolean() });

const columns: ColumnDef<Vehicle>[] = [
  { key: "reg", header: "Registration", render: (row) => row.registration_number },
  { key: "type", header: "Type", render: (row) => <StatusBadge value={row.vehicle_type} /> },
  { key: "owner", header: "Ownership", render: (row) => <StatusBadge value={row.ownership_type} /> },
  { key: "cap", header: "Capacity", render: (row) => row.capacity_kg ?? "-" },
  { key: "status", header: "Status", render: (row) => <StatusBadge value={row.is_active ? "ACTIVE" : "INACTIVE"} /> },
  { key: "updated", header: "Updated", render: (row) => formatDate(row.updated_at) },
];

export default function VehiclesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<"create" | "view" | "edit" | null>(null);
  const [selected, setSelected] = useState<Vehicle | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({ city_id: "", ward_id: "", zone_id: "", registration_number: "", vehicle_type: "AUTO_TIPPER", ownership_type: "MUNICIPAL", capacity_kg: "", is_active: true });

  const query = useQuery({ queryKey: queryKeys.vehicles.list(), queryFn: () => listVehicles() });
  const createMutation = useMutation({ mutationFn: createVehicle, onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.all }); setMode(null); setFormError(null); } });

  const rows = useMemo(() => (query.data ?? []).filter((row) => [row.registration_number, row.vehicle_type, row.ownership_type].join(" ").toLowerCase().includes(search.toLowerCase())), [query.data, search]);

  function submitCreate() {
    const parsed = schema.safeParse({ ...form, capacity_kg: form.capacity_kg ? Number(form.capacity_kg) : undefined });
    if (!parsed.success) { setFormError(parsed.error.issues[0]?.message ?? "Invalid form"); return; }
    createMutation.mutate({ ...parsed.data, ward_id: parsed.data.ward_id || null, zone_id: parsed.data.zone_id || null, capacity_kg: parsed.data.capacity_kg ?? null });
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Vehicles" description="Fleet assets and operational vehicles." actions={<Button onClick={() => setMode("create")}>Create Vehicle</Button>} />
      <FilterBar onReset={() => setSearch("")}><Input placeholder="Search vehicle" value={search} onChange={(event) => setSearch(event.target.value)} /></FilterBar>
      <EntityTable columns={columns} rows={rows} isLoading={query.isLoading} isError={query.isError} errorMessage={getErrorMessage(query.error)} emptyTitle="No vehicles found" emptyDescription="Create a vehicle to get started." onRetry={() => void query.refetch()} rowActions={(row) => <RowActions row={row} onView={(item) => { setSelected(item); setMode("view"); }} onEdit={(item) => { setSelected(item); setMode("edit"); }} />} />

      <EntityFormDrawer open={mode === "create" || mode === "edit"} onOpenChange={(open) => !open && setMode(null)} title={mode === "create" ? "Create Vehicle" : `Edit ${selected?.registration_number ?? "Vehicle"}`} subtitle="Vehicle profile" mode={mode === "edit" ? "edit" : "create"} isSubmitting={createMutation.isPending} onSubmit={submitCreate}>
        <FieldGrid>
          <FormTextField label="City ID" value={mode === "edit" ? selected?.city_id ?? "" : form.city_id} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, city_id: value }))} />
          <FormTextField label="Ward ID" value={mode === "edit" ? selected?.ward_id ?? "" : form.ward_id} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, ward_id: value }))} />
          <FormTextField label="Zone ID" value={mode === "edit" ? selected?.zone_id ?? "" : form.zone_id} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, zone_id: value }))} />
          <FormTextField label="Registration Number" value={mode === "edit" ? selected?.registration_number ?? "" : form.registration_number} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, registration_number: value }))} />
          <FormSelectField label="Vehicle Type" value={mode === "edit" ? selected?.vehicle_type ?? "AUTO_TIPPER" : form.vehicle_type} disabled={mode === "edit"} options={VEHICLE_TYPES.map((item) => ({ label: item, value: item }))} onChange={(value) => setForm((prev) => ({ ...prev, vehicle_type: value }))} />
          <FormSelectField label="Ownership" value={mode === "edit" ? selected?.ownership_type ?? "MUNICIPAL" : form.ownership_type} disabled={mode === "edit"} options={OWNERSHIP_TYPES.map((item) => ({ label: item, value: item }))} onChange={(value) => setForm((prev) => ({ ...prev, ownership_type: value }))} />
          <FormTextField label="Capacity (kg)" type="number" value={mode === "edit" ? String(selected?.capacity_kg ?? "") : form.capacity_kg} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, capacity_kg: value }))} />
          <FormSelectField label="Status" value={String(mode === "edit" ? selected?.is_active ?? false : form.is_active)} disabled={mode === "edit"} options={BOOLEAN_OPTIONS} onChange={(value) => setForm((prev) => ({ ...prev, is_active: value === "true" }))} />
        </FieldGrid>
        {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
        {createMutation.isError ? <p className="text-sm text-red-600">{getErrorMessage(createMutation.error)}</p> : null}
      </EntityFormDrawer>

      <EntityFormDrawer open={mode === "view"} onOpenChange={(open) => !open && setMode(null)} title={selected?.registration_number ?? "Vehicle"} subtitle="Vehicle details" mode="edit">
        {selected ? <EntityDetailsCard title="Summary" items={[{ label: "ID", value: selected.id }, { label: "City", value: selected.city_id }, { label: "Ward", value: selected.ward_id ?? "-" }, { label: "Type", value: selected.vehicle_type }, { label: "Ownership", value: selected.ownership_type }, { label: "Status", value: <StatusBadge value={selected.is_active ? "ACTIVE" : "INACTIVE"} /> }, { label: "Updated", value: formatDate(selected.updated_at) }]} /> : null}
      </EntityFormDrawer>
    </div>
  );
}
