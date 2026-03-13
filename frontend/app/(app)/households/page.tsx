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
import { BOOLEAN_OPTIONS, DWELLING_TYPES, ONBOARDING_STATUSES } from "@/lib/constants";
import { getErrorMessage } from "@/lib/api/query-utils";
import { createHousehold, listHouseholds } from "@/lib/api/services";
import { formatDate } from "@/lib/utils";
import { queryKeys } from "@/types/query-keys";
import type { ColumnDef } from "@/types/table";
import type { Household } from "@/types/domain";

const schema = z.object({
  city_id: z.string().uuid(),
  ward_id: z.string().uuid(),
  zone_id: z.string().uuid().optional().or(z.literal("")),
  organization_id: z.string().uuid().optional().or(z.literal("")),
  household_code: z.string().min(2),
  household_head_name: z.string().min(2),
  contact_phone: z.string().optional(),
  contact_email: z.string().email().optional().or(z.literal("")),
  number_of_members: z.coerce.number().min(1).optional(),
  dwelling_type: z.string().optional(),
  onboarding_status: z.string().min(1),
  is_active: z.boolean(),
});

const columns: ColumnDef<Household>[] = [
  { key: "code", header: "Code", render: (row) => row.household_code },
  { key: "head", header: "Head", render: (row) => row.household_head_name },
  { key: "phone", header: "Phone", render: (row) => row.contact_phone ?? "-" },
  { key: "onboarding", header: "Onboarding", render: (row) => <StatusBadge value={row.onboarding_status} /> },
  { key: "status", header: "Active", render: (row) => <StatusBadge value={row.is_active ? "ACTIVE" : "INACTIVE"} /> },
  { key: "updated", header: "Updated", render: (row) => formatDate(row.updated_at) },
];

export default function HouseholdsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [onboardingStatus, setOnboardingStatus] = useState("all");
  const [isActive, setIsActive] = useState("all");
  const [mode, setMode] = useState<"create" | "edit" | null>(null);
  const [selected, setSelected] = useState<Household | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({ city_id: "", ward_id: "", zone_id: "", organization_id: "", household_code: "", household_head_name: "", contact_phone: "", contact_email: "", number_of_members: "", dwelling_type: "APARTMENT", onboarding_status: "PENDING", is_active: true });

  const params = useMemo(() => ({ onboarding_status: onboardingStatus === "all" ? undefined : onboardingStatus, is_active: isActive === "all" ? undefined : isActive === "true" }), [onboardingStatus, isActive]);
  const query = useQuery({ queryKey: queryKeys.households.list(params), queryFn: () => listHouseholds(params) });

  const createMutation = useMutation({ mutationFn: createHousehold, onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: queryKeys.households.all }); setMode(null); setFormError(null); } });

  const rows = useMemo(() => (query.data ?? []).filter((row) => [row.household_code, row.household_head_name, row.contact_phone ?? ""].join(" ").toLowerCase().includes(search.toLowerCase())), [query.data, search]);

  function submitCreate() {
    const parsed = schema.safeParse({ ...form, number_of_members: form.number_of_members ? Number(form.number_of_members) : undefined });
    if (!parsed.success) { setFormError(parsed.error.issues[0]?.message ?? "Invalid form"); return; }
    createMutation.mutate({ ...parsed.data, zone_id: parsed.data.zone_id || null, organization_id: parsed.data.organization_id || null, contact_phone: parsed.data.contact_phone || null, contact_email: parsed.data.contact_email || null, number_of_members: parsed.data.number_of_members ?? null, dwelling_type: parsed.data.dwelling_type || null });
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Households" description="Registered household entities." actions={<Button onClick={() => setMode("create")}>Create Household</Button>} />
      <FilterBar onReset={() => { setSearch(""); setOnboardingStatus("all"); setIsActive("all"); }}>
        <Input placeholder="Search household" value={search} onChange={(event) => setSearch(event.target.value)} />
        <FormSelectField label="Onboarding" value={onboardingStatus} options={[{ label: "All", value: "all" }, ...ONBOARDING_STATUSES.map((s) => ({ label: s, value: s }))]} onChange={setOnboardingStatus} />
        <FormSelectField label="Status" value={isActive} options={[{ label: "All", value: "all" }, ...BOOLEAN_OPTIONS]} onChange={setIsActive} />
      </FilterBar>
      <EntityTable columns={columns} rows={rows} isLoading={query.isLoading} isError={query.isError} errorMessage={getErrorMessage(query.error)} emptyTitle="No households found" emptyDescription="Create a household to get started." onRetry={() => void query.refetch()} rowActions={(row) => <RowActions row={row} viewHref={`/households/${row.id}`} onEdit={(item) => { setSelected(item); setMode("edit"); }} />} />

      <EntityFormDrawer open={mode === "create" || mode === "edit"} onOpenChange={(open) => !open && setMode(null)} title={mode === "create" ? "Create Household" : `Edit ${selected?.household_code ?? "Household"}`} subtitle="Household profile" mode={mode === "edit" ? "edit" : "create"} isSubmitting={createMutation.isPending} onSubmit={submitCreate}>
        <FieldGrid>
          <FormTextField label="Organization ID" value={mode === "edit" ? selected?.organization_id ?? "" : form.organization_id} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, organization_id: value }))} />
          <FormTextField label="City ID" value={mode === "edit" ? selected?.city_id ?? "" : form.city_id} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, city_id: value }))} />
          <FormTextField label="Ward ID" value={mode === "edit" ? selected?.ward_id ?? "" : form.ward_id} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, ward_id: value }))} />
          <FormTextField label="Zone ID" value={mode === "edit" ? selected?.zone_id ?? "" : form.zone_id} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, zone_id: value }))} />
          <FormTextField label="Household Code" value={mode === "edit" ? selected?.household_code ?? "" : form.household_code} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, household_code: value }))} />
          <FormTextField label="Head Name" value={mode === "edit" ? selected?.household_head_name ?? "" : form.household_head_name} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, household_head_name: value }))} />
          <FormTextField label="Phone" value={mode === "edit" ? selected?.contact_phone ?? "" : form.contact_phone} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, contact_phone: value }))} />
          <FormTextField label="Email" value={mode === "edit" ? selected?.contact_email ?? "" : form.contact_email} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, contact_email: value }))} />
          <FormTextField label="Members" type="number" value={mode === "edit" ? String(selected?.number_of_members ?? "") : form.number_of_members} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, number_of_members: value }))} />
          <FormSelectField label="Dwelling Type" value={mode === "edit" ? selected?.dwelling_type ?? "APARTMENT" : form.dwelling_type} disabled={mode === "edit"} options={DWELLING_TYPES.map((item) => ({ label: item, value: item }))} onChange={(value) => setForm((prev) => ({ ...prev, dwelling_type: value }))} />
          <FormSelectField label="Onboarding" value={mode === "edit" ? selected?.onboarding_status ?? "PENDING" : form.onboarding_status} disabled={mode === "edit"} options={ONBOARDING_STATUSES.map((item) => ({ label: item, value: item }))} onChange={(value) => setForm((prev) => ({ ...prev, onboarding_status: value }))} />
          <FormSelectField label="Active" value={String(mode === "edit" ? selected?.is_active ?? false : form.is_active)} disabled={mode === "edit"} options={BOOLEAN_OPTIONS} onChange={(value) => setForm((prev) => ({ ...prev, is_active: value === "true" }))} />
        </FieldGrid>
        {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
        {createMutation.isError ? <p className="text-sm text-red-600">{getErrorMessage(createMutation.error)}</p> : null}
      </EntityFormDrawer>
    </div>
  );
}
