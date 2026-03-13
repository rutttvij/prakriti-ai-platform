"use client";

import { z } from "zod";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { EntityDetailsCard } from "@/components/crud/entity-details-card";
import { EntityFormDrawer } from "@/components/crud/entity-form-drawer";
import { EntityTable } from "@/components/crud/entity-table";
import { FieldGrid } from "@/components/crud/field-grid";
import { RowActions } from "@/components/crud/row-actions";
import { FormSelectField, FormTextField } from "@/components/forms/form-fields";
import { FilterBar } from "@/components/ui-extensions/filter-bar";
import { PageHeader } from "@/components/ui-extensions/page-header";
import { StatusBadge } from "@/components/ui-extensions/status-badge";
import { Input } from "@/components/ui/input";
import { BOOLEAN_OPTIONS } from "@/lib/constants";
import { getErrorMessage } from "@/lib/api/query-utils";
import { createOrganization, listOrganizations } from "@/lib/api/services";
import { formatDate } from "@/lib/utils";
import { queryKeys } from "@/types/query-keys";
import type { Organization } from "@/types/domain";
import type { ColumnDef } from "@/types/table";

const schema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  type: z.string().min(2),
  is_active: z.boolean(),
});

const columns: ColumnDef<Organization>[] = [
  { key: "name", header: "Name", render: (row) => row.name },
  { key: "slug", header: "Slug", render: (row) => row.slug },
  { key: "type", header: "Type", render: (row) => row.type },
  { key: "status", header: "Status", render: (row) => <StatusBadge value={row.is_active ? "ACTIVE" : "INACTIVE"} /> },
  { key: "updated", header: "Updated", render: (row) => formatDate(row.updated_at) },
];

export default function OrganizationsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<"create" | "view" | "edit" | null>(null);
  const [selected, setSelected] = useState<Organization | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", type: "", is_active: true });
  const [formError, setFormError] = useState<string | null>(null);

  const query = useQuery({
    queryKey: queryKeys.organizations.list(),
    queryFn: () => listOrganizations(),
  });

  const createMutation = useMutation({
    mutationFn: createOrganization,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.organizations.all });
      setMode(null);
      setForm({ name: "", slug: "", type: "", is_active: true });
      setFormError(null);
    },
  });

  const rows = useMemo(
    () => (query.data ?? []).filter((row) => [row.name, row.slug, row.type].join(" ").toLowerCase().includes(search.toLowerCase())),
    [query.data, search],
  );

  function openCreate() {
    setMode("create");
    setForm({ name: "", slug: "", type: "", is_active: true });
    setFormError(null);
  }

  function openView(row: Organization) {
    setSelected(row);
    setMode("view");
  }

  function openEdit(row: Organization) {
    setSelected(row);
    setMode("edit");
  }

  function submitCreate() {
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "Invalid form");
      return;
    }
    setFormError(null);
    createMutation.mutate(parsed.data);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Organizations" description="Manage municipal organizations." actions={<button className="inline-flex h-10 items-center rounded-md bg-emerald-600 px-4 text-sm font-medium text-white" onClick={openCreate}>Create Organization</button>} />

      <FilterBar onReset={() => setSearch("")}> 
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search organizations" />
      </FilterBar>

      <EntityTable
        columns={columns}
        rows={rows}
        isLoading={query.isLoading}
        isError={query.isError}
        errorMessage={getErrorMessage(query.error)}
        emptyTitle="No organizations found"
        emptyDescription="Create an organization to get started."
        onRetry={() => void query.refetch()}
        rowActions={(row) => <RowActions row={row} onView={openView} onEdit={openEdit} />}
      />

      <EntityFormDrawer
        open={mode === "create" || mode === "edit"}
        onOpenChange={(open) => !open && setMode(null)}
        title={mode === "create" ? "Create Organization" : `Edit ${selected?.name ?? "Organization"}`}
        subtitle="Organization master profile"
        mode={mode === "edit" ? "edit" : "create"}
        isSubmitting={createMutation.isPending}
        onSubmit={submitCreate}
      >
        <FieldGrid>
          <FormTextField label="Name" value={mode === "edit" ? selected?.name ?? "" : form.name} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, name: value }))} />
          <FormTextField label="Slug" value={mode === "edit" ? selected?.slug ?? "" : form.slug} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, slug: value }))} />
          <FormTextField label="Type" value={mode === "edit" ? selected?.type ?? "" : form.type} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, type: value }))} />
          <FormSelectField
            label="Status"
            value={String(mode === "edit" ? selected?.is_active ?? false : form.is_active)}
            disabled={mode === "edit"}
            options={BOOLEAN_OPTIONS}
            onChange={(value) => setForm((prev) => ({ ...prev, is_active: value === "true" }))}
          />
        </FieldGrid>
        {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
        {createMutation.isError ? <p className="text-sm text-red-600">{getErrorMessage(createMutation.error)}</p> : null}
      </EntityFormDrawer>

      <EntityFormDrawer
        open={mode === "view"}
        onOpenChange={(open) => !open && setMode(null)}
        title={selected?.name ?? "Organization"}
        subtitle="Organization details"
        mode="edit"
      >
        {selected ? (
          <EntityDetailsCard
            title="Summary"
            items={[
              { label: "ID", value: selected.id },
              { label: "Name", value: selected.name },
              { label: "Slug", value: selected.slug },
              { label: "Type", value: selected.type },
              { label: "Status", value: <StatusBadge value={selected.is_active ? "ACTIVE" : "INACTIVE"} /> },
              { label: "Created", value: formatDate(selected.created_at) },
              { label: "Updated", value: formatDate(selected.updated_at) },
            ]}
          />
        ) : null}
      </EntityFormDrawer>
    </div>
  );
}
