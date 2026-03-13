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
import { BOOLEAN_OPTIONS, COMPLIANCE_STATUSES, GENERATOR_TYPES, ONBOARDING_STATUSES } from "@/lib/constants";
import { getErrorMessage } from "@/lib/api/query-utils";
import { createBulkGenerator, listBulkGenerators } from "@/lib/api/services";
import { formatDate } from "@/lib/utils";
import { queryKeys } from "@/types/query-keys";
import type { BulkGenerator } from "@/types/domain";
import type { ColumnDef } from "@/types/table";

const schema = z.object({ city_id: z.string().uuid(), ward_id: z.string().uuid(), zone_id: z.string().uuid().optional().or(z.literal("")), organization_id: z.string().uuid().optional().or(z.literal("")), generator_code: z.string().min(2), entity_name: z.string().min(2), contact_person_name: z.string().min(2), contact_phone: z.string().min(5), contact_email: z.string().email().optional().or(z.literal("")), generator_type: z.string().min(1), estimated_daily_waste_kg: z.coerce.number().nonnegative().optional(), compliance_status: z.string().min(1), onboarding_status: z.string().min(1), is_active: z.boolean() });

const columns: ColumnDef<BulkGenerator>[] = [
  { key: "code", header: "Code", render: (row) => row.generator_code },
  { key: "entity", header: "Entity", render: (row) => row.entity_name },
  { key: "type", header: "Type", render: (row) => <StatusBadge value={row.generator_type} /> },
  { key: "compliance", header: "Compliance", render: (row) => <StatusBadge value={row.compliance_status} /> },
  { key: "onboard", header: "Onboarding", render: (row) => <StatusBadge value={row.onboarding_status} /> },
  { key: "updated", header: "Updated", render: (row) => formatDate(row.updated_at) },
];

export default function BulkGeneratorsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<"create" | "edit" | null>(null);
  const [selected, setSelected] = useState<BulkGenerator | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({ city_id: "", ward_id: "", zone_id: "", organization_id: "", generator_code: "", entity_name: "", contact_person_name: "", contact_phone: "", contact_email: "", generator_type: "HOTEL", estimated_daily_waste_kg: "", compliance_status: "UNDER_REVIEW", onboarding_status: "PENDING", is_active: true });

  const query = useQuery({ queryKey: queryKeys.bulkGenerators.list(), queryFn: () => listBulkGenerators() });
  const createMutation = useMutation({ mutationFn: createBulkGenerator, onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: queryKeys.bulkGenerators.all }); setMode(null); setFormError(null); } });

  const rows = useMemo(() => (query.data ?? []).filter((row) => [row.generator_code, row.entity_name, row.contact_person_name, row.contact_phone].join(" ").toLowerCase().includes(search.toLowerCase())), [query.data, search]);

  function submitCreate() {
    const parsed = schema.safeParse({ ...form, estimated_daily_waste_kg: form.estimated_daily_waste_kg ? Number(form.estimated_daily_waste_kg) : undefined });
    if (!parsed.success) { setFormError(parsed.error.issues[0]?.message ?? "Invalid form"); return; }
    createMutation.mutate({ ...parsed.data, organization_id: parsed.data.organization_id || null, zone_id: parsed.data.zone_id || null, contact_email: parsed.data.contact_email || null, estimated_daily_waste_kg: parsed.data.estimated_daily_waste_kg ?? null });
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Bulk Generators" description="Commercial and institutional waste generators." actions={<Button onClick={() => setMode("create")}>Create Bulk Generator</Button>} />
      <FilterBar onReset={() => setSearch("")}><Input placeholder="Search bulk generator" value={search} onChange={(event) => setSearch(event.target.value)} /></FilterBar>
      <EntityTable columns={columns} rows={rows} isLoading={query.isLoading} isError={query.isError} errorMessage={getErrorMessage(query.error)} emptyTitle="No bulk generators found" emptyDescription="Create a bulk generator to get started." onRetry={() => void query.refetch()} rowActions={(row) => <RowActions row={row} viewHref={`/bulk-generators/${row.id}`} onEdit={(item) => { setSelected(item); setMode("edit"); }} />} />
      <EntityFormDrawer open={mode === "create" || mode === "edit"} onOpenChange={(open) => !open && setMode(null)} title={mode === "create" ? "Create Bulk Generator" : `Edit ${selected?.entity_name ?? "Bulk Generator"}`} subtitle="Bulk generator profile" mode={mode === "edit" ? "edit" : "create"} isSubmitting={createMutation.isPending} onSubmit={submitCreate}>
        <FieldGrid>
          <FormTextField label="Organization ID" value={mode === "edit" ? selected?.organization_id ?? "" : form.organization_id} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, organization_id: value }))} />
          <FormTextField label="City ID" value={mode === "edit" ? selected?.city_id ?? "" : form.city_id} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, city_id: value }))} />
          <FormTextField label="Ward ID" value={mode === "edit" ? selected?.ward_id ?? "" : form.ward_id} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, ward_id: value }))} />
          <FormTextField label="Zone ID" value={mode === "edit" ? selected?.zone_id ?? "" : form.zone_id} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, zone_id: value }))} />
          <FormTextField label="Generator Code" value={mode === "edit" ? selected?.generator_code ?? "" : form.generator_code} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, generator_code: value }))} />
          <FormTextField label="Entity Name" value={mode === "edit" ? selected?.entity_name ?? "" : form.entity_name} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, entity_name: value }))} />
          <FormTextField label="Contact Person" value={mode === "edit" ? selected?.contact_person_name ?? "" : form.contact_person_name} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, contact_person_name: value }))} />
          <FormTextField label="Contact Phone" value={mode === "edit" ? selected?.contact_phone ?? "" : form.contact_phone} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, contact_phone: value }))} />
          <FormTextField label="Contact Email" value={mode === "edit" ? selected?.contact_email ?? "" : form.contact_email} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, contact_email: value }))} />
          <FormSelectField label="Generator Type" value={mode === "edit" ? selected?.generator_type ?? "HOTEL" : form.generator_type} disabled={mode === "edit"} options={GENERATOR_TYPES.map((item) => ({ label: item, value: item }))} onChange={(value) => setForm((prev) => ({ ...prev, generator_type: value }))} />
          <FormTextField label="Estimated Daily Waste (kg)" type="number" value={mode === "edit" ? String(selected?.estimated_daily_waste_kg ?? "") : form.estimated_daily_waste_kg} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, estimated_daily_waste_kg: value }))} />
          <FormSelectField label="Compliance" value={mode === "edit" ? selected?.compliance_status ?? "UNDER_REVIEW" : form.compliance_status} disabled={mode === "edit"} options={COMPLIANCE_STATUSES.map((item) => ({ label: item, value: item }))} onChange={(value) => setForm((prev) => ({ ...prev, compliance_status: value }))} />
          <FormSelectField label="Onboarding" value={mode === "edit" ? selected?.onboarding_status ?? "PENDING" : form.onboarding_status} disabled={mode === "edit"} options={ONBOARDING_STATUSES.map((item) => ({ label: item, value: item }))} onChange={(value) => setForm((prev) => ({ ...prev, onboarding_status: value }))} />
          <FormSelectField label="Active" value={String(mode === "edit" ? selected?.is_active ?? false : form.is_active)} disabled={mode === "edit"} options={BOOLEAN_OPTIONS} onChange={(value) => setForm((prev) => ({ ...prev, is_active: value === "true" }))} />
        </FieldGrid>
        {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
        {createMutation.isError ? <p className="text-sm text-red-600">{getErrorMessage(createMutation.error)}</p> : null}
      </EntityFormDrawer>
    </div>
  );
}
