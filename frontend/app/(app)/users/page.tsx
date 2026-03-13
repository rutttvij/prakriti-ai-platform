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
import { BOOLEAN_OPTIONS, ROLE_CODE_OPTIONS } from "@/lib/constants";
import { getErrorMessage } from "@/lib/api/query-utils";
import { createUser, listUsers } from "@/lib/api/services";
import { formatDate } from "@/lib/utils";
import { queryKeys } from "@/types/query-keys";
import type { UserListItem } from "@/types/domain";
import type { ColumnDef } from "@/types/table";

const schema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
  organization_id: z.string().uuid().optional().or(z.literal("")),
  city_id: z.string().uuid().optional().or(z.literal("")),
  ward_id: z.string().uuid().optional().or(z.literal("")),
  zone_id: z.string().uuid().optional().or(z.literal("")),
  role_codes: z.array(z.string()).min(1),
  is_active: z.boolean(),
  is_superuser: z.boolean(),
  is_verified: z.boolean(),
});

const columns: ColumnDef<UserListItem>[] = [
  { key: "name", header: "Name", render: (row) => row.full_name },
  { key: "email", header: "Email", render: (row) => row.email },
  { key: "roles", header: "Roles", render: (row) => row.roles.map((role) => role.code).join(", ") || "-" },
  { key: "active", header: "Active", render: (row) => <StatusBadge value={row.is_active ? "ACTIVE" : "INACTIVE"} /> },
  { key: "verified", header: "Verified", render: (row) => <StatusBadge value={row.is_verified ? "VERIFIED" : "PENDING"} /> },
  { key: "updated", header: "Updated", render: (row) => formatDate(row.updated_at) },
];

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<"create" | "view" | "edit" | null>(null);
  const [selected, setSelected] = useState<UserListItem | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [roleCodesInput, setRoleCodesInput] = useState("CITY_ADMIN");
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    phone: "",
    organization_id: "",
    city_id: "",
    ward_id: "",
    zone_id: "",
    role_codes: ["CITY_ADMIN"],
    is_active: true,
    is_superuser: false,
    is_verified: false,
  });

  const query = useQuery({ queryKey: queryKeys.users.list(), queryFn: () => listUsers() });
  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      setMode(null);
      setFormError(null);
    },
  });

  const rows = useMemo(() => (query.data ?? []).filter((row) => [row.full_name, row.email].join(" ").toLowerCase().includes(search.toLowerCase())), [query.data, search]);

  function submitCreate() {
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "Invalid form");
      return;
    }

    const payload = {
      ...parsed.data,
      phone: parsed.data.phone || null,
      organization_id: parsed.data.organization_id || null,
      city_id: parsed.data.city_id || null,
      ward_id: parsed.data.ward_id || null,
      zone_id: parsed.data.zone_id || null,
    };

    createMutation.mutate(payload);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Users" description="Manage users and role assignments." actions={<Button onClick={() => setMode("create")}>Create User</Button>} />
      <FilterBar onReset={() => setSearch("")}><Input placeholder="Search user" value={search} onChange={(event) => setSearch(event.target.value)} /></FilterBar>
      <EntityTable columns={columns} rows={rows} isLoading={query.isLoading} isError={query.isError} errorMessage={getErrorMessage(query.error)} emptyTitle="No users found" emptyDescription="Create a user to get started." onRetry={() => void query.refetch()} rowActions={(row) => <RowActions row={row} onView={(item) => { setSelected(item); setMode("view"); }} onEdit={(item) => { setSelected(item); setMode("edit"); }} />} />

      <EntityFormDrawer open={mode === "create" || mode === "edit"} onOpenChange={(open) => !open && setMode(null)} title={mode === "create" ? "Create User" : `Edit ${selected?.full_name ?? "User"}`} subtitle="User account profile" mode={mode === "edit" ? "edit" : "create"} isSubmitting={createMutation.isPending} onSubmit={submitCreate}>
        <FieldGrid>
          <FormTextField label="Full Name" value={mode === "edit" ? selected?.full_name ?? "" : form.full_name} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, full_name: value }))} />
          <FormTextField label="Email" value={mode === "edit" ? selected?.email ?? "" : form.email} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, email: value }))} />
          <FormTextField label="Password" type="password" value={mode === "edit" ? "********" : form.password} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, password: value }))} />
          <FormTextField label="Phone" value={mode === "edit" ? selected?.phone ?? "" : form.phone} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, phone: value }))} />
          <FormTextField label="Organization ID" value={mode === "edit" ? selected?.organization_id ?? "" : form.organization_id} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, organization_id: value }))} />
          <FormTextField label="City ID" value={mode === "edit" ? selected?.city_id ?? "" : form.city_id} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, city_id: value }))} />
          <FormTextField label="Ward ID" value={mode === "edit" ? selected?.ward_id ?? "" : form.ward_id} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, ward_id: value }))} />
          <FormTextField label="Zone ID" value={mode === "edit" ? selected?.zone_id ?? "" : form.zone_id} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, zone_id: value }))} />
          <FormSelectField label="Role Code" value={mode === "edit" ? selected?.roles[0]?.code ?? "CITY_ADMIN" : roleCodesInput} disabled={mode === "edit"} options={ROLE_CODE_OPTIONS.map((code) => ({ label: code, value: code }))} onChange={(value) => { setRoleCodesInput(value); setForm((prev) => ({ ...prev, role_codes: [value] })); }} />
          <FormSelectField label="Active" value={String(mode === "edit" ? selected?.is_active ?? false : form.is_active)} disabled={mode === "edit"} options={BOOLEAN_OPTIONS} onChange={(value) => setForm((prev) => ({ ...prev, is_active: value === "true" }))} />
          <FormSelectField label="Superuser" value={String(mode === "edit" ? selected?.is_superuser ?? false : form.is_superuser)} disabled={mode === "edit"} options={BOOLEAN_OPTIONS} onChange={(value) => setForm((prev) => ({ ...prev, is_superuser: value === "true" }))} />
          <FormSelectField label="Verified" value={String(mode === "edit" ? selected?.is_verified ?? false : form.is_verified)} disabled={mode === "edit"} options={BOOLEAN_OPTIONS} onChange={(value) => setForm((prev) => ({ ...prev, is_verified: value === "true" }))} />
        </FieldGrid>
        {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
        {createMutation.isError ? <p className="text-sm text-red-600">{getErrorMessage(createMutation.error)}</p> : null}
      </EntityFormDrawer>

      <EntityFormDrawer open={mode === "view"} onOpenChange={(open) => !open && setMode(null)} title={selected?.full_name ?? "User"} subtitle="User details" mode="edit">
        {selected ? <EntityDetailsCard title="Summary" items={[{ label: "ID", value: selected.id }, { label: "Name", value: selected.full_name }, { label: "Email", value: selected.email }, { label: "Roles", value: selected.roles.map((role) => role.code).join(", ") || "-" }, { label: "Status", value: <StatusBadge value={selected.is_active ? "ACTIVE" : "INACTIVE"} /> }, { label: "Updated", value: formatDate(selected.updated_at) }]} /> : null}
      </EntityFormDrawer>
    </div>
  );
}
