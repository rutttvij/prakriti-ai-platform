"use client";

import { useMemo, useState } from "react";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { EntityFormDrawer } from "@/components/crud/entity-form-drawer";
import { EntityTable } from "@/components/crud/entity-table";
import { FieldGrid } from "@/components/crud/field-grid";
import { FormSelectField, FormTextField, FormTextareaField } from "@/components/forms/form-fields";
import { Button } from "@/components/ui/button";
import { FilterBar } from "@/components/ui-extensions/filter-bar";
import { PageHeader } from "@/components/ui-extensions/page-header";
import { StatusBadge } from "@/components/ui-extensions/status-badge";
import { Input } from "@/components/ui/input";
import { RECOVERY_METHODS, VERIFICATION_STATUSES, WASTE_TYPES } from "@/lib/constants";
import { getErrorMessage } from "@/lib/api/query-utils";
import { createRecoveryCertificate, listRecoveryCertificates } from "@/lib/api/services";
import { formatDate } from "@/lib/utils";
import { queryKeys } from "@/types/query-keys";
import type { ColumnDef } from "@/types/table";
import type { RecoveryCertificate } from "@/types/domain";

const schema = z.object({
  certificate_number: z.string().min(2),
  facility_id: z.string().uuid(),
  batch_id: z.string().uuid(),
  bulk_generator_id: z.string().uuid().optional().or(z.literal("")),
  issue_date: z.string().min(1),
  waste_type: z.string().min(1),
  certified_weight_kg: z.coerce.number().positive(),
  recovery_method: z.string().min(1),
  issued_by_user_id: z.string().uuid().optional().or(z.literal("")),
  verification_status: z.string().min(1),
  certificate_url: z.string().url().optional().or(z.literal("")),
  notes: z.string().optional(),
});

const columns: ColumnDef<RecoveryCertificate>[] = [
  { key: "cert", header: "Certificate #", render: (row) => row.certificate_number },
  { key: "batch", header: "Batch ID", render: (row) => row.batch_id },
  { key: "method", header: "Recovery Method", render: (row) => <StatusBadge value={row.recovery_method} /> },
  { key: "weight", header: "Certified Weight (kg)", render: (row) => row.certified_weight_kg },
  { key: "verification", header: "Verification", render: (row) => <StatusBadge value={row.verification_status} /> },
  { key: "issue", header: "Issue Date", render: (row) => formatDate(row.issue_date) },
];

export default function RecoveryCertificatesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<"create" | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({
    certificate_number: "",
    facility_id: "",
    batch_id: "",
    bulk_generator_id: "",
    issue_date: "",
    waste_type: "MIXED_MSW",
    certified_weight_kg: "",
    recovery_method: "RECYCLING",
    issued_by_user_id: "",
    verification_status: "PENDING",
    certificate_url: "",
    notes: "",
  });

  const query = useQuery({ queryKey: queryKeys.recoveryCertificates.list(), queryFn: () => listRecoveryCertificates() });
  const createMutation = useMutation({
    mutationFn: createRecoveryCertificate,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.recoveryCertificates.all });
      setMode(null);
      setFormError(null);
    },
  });

  const rows = useMemo(
    () => (query.data ?? []).filter((row) => [row.certificate_number, row.batch_id, row.recovery_method, row.verification_status].join(" ").toLowerCase().includes(search.toLowerCase())),
    [query.data, search],
  );

  function submitCreate() {
    const parsed = schema.safeParse({ ...form, certified_weight_kg: Number(form.certified_weight_kg) });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "Invalid form");
      return;
    }
    createMutation.mutate({
      ...parsed.data,
      bulk_generator_id: parsed.data.bulk_generator_id || null,
      issued_by_user_id: parsed.data.issued_by_user_id || null,
      certificate_url: parsed.data.certificate_url || null,
      notes: parsed.data.notes || null,
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Recovery Certificates" description="Issue and track recovery evidence for processed waste outputs." actions={<Button onClick={() => setMode("create")}>Create Certificate</Button>} />
      <FilterBar onReset={() => setSearch("")}>
        <Input placeholder="Search certificate" value={search} onChange={(event) => setSearch(event.target.value)} />
      </FilterBar>
      <EntityTable
        columns={columns}
        rows={rows}
        isLoading={query.isLoading}
        isError={query.isError}
        errorMessage={getErrorMessage(query.error)}
        emptyTitle="No recovery certificates found"
        emptyDescription="Create certificates to document recovery outcomes."
        onRetry={() => void query.refetch()}
      />

      <EntityFormDrawer open={mode === "create"} onOpenChange={(open) => !open && setMode(null)} title="Create Recovery Certificate" subtitle="Certification and verification details" mode="create" isSubmitting={createMutation.isPending} onSubmit={submitCreate}>
        <FieldGrid>
          <FormTextField label="Certificate Number" value={form.certificate_number} onChange={(value) => setForm((prev) => ({ ...prev, certificate_number: value }))} />
          <FormTextField label="Facility ID" value={form.facility_id} onChange={(value) => setForm((prev) => ({ ...prev, facility_id: value }))} />
          <FormTextField label="Batch ID" value={form.batch_id} onChange={(value) => setForm((prev) => ({ ...prev, batch_id: value }))} />
          <FormTextField label="Bulk Generator ID" value={form.bulk_generator_id} onChange={(value) => setForm((prev) => ({ ...prev, bulk_generator_id: value }))} />
          <FormTextField label="Issue Date" type="date" value={form.issue_date} onChange={(value) => setForm((prev) => ({ ...prev, issue_date: value }))} />
          <FormSelectField label="Waste Type" value={form.waste_type} options={WASTE_TYPES.map((item) => ({ label: item, value: item }))} onChange={(value) => setForm((prev) => ({ ...prev, waste_type: value }))} />
          <FormTextField label="Certified Weight (kg)" type="number" value={form.certified_weight_kg} onChange={(value) => setForm((prev) => ({ ...prev, certified_weight_kg: value }))} />
          <FormSelectField label="Recovery Method" value={form.recovery_method} options={RECOVERY_METHODS.map((item) => ({ label: item, value: item }))} onChange={(value) => setForm((prev) => ({ ...prev, recovery_method: value }))} />
          <FormTextField label="Issued By User ID" value={form.issued_by_user_id} onChange={(value) => setForm((prev) => ({ ...prev, issued_by_user_id: value }))} />
          <FormSelectField label="Verification Status" value={form.verification_status} options={VERIFICATION_STATUSES.map((item) => ({ label: item, value: item }))} onChange={(value) => setForm((prev) => ({ ...prev, verification_status: value }))} />
          <FormTextField label="Certificate URL" value={form.certificate_url} onChange={(value) => setForm((prev) => ({ ...prev, certificate_url: value }))} />
        </FieldGrid>
        <FormTextareaField label="Notes" value={form.notes} onChange={(value) => setForm((prev) => ({ ...prev, notes: value }))} />
        {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
        {createMutation.isError ? <p className="text-sm text-red-600">{getErrorMessage(createMutation.error)}</p> : null}
      </EntityFormDrawer>
    </div>
  );
}
