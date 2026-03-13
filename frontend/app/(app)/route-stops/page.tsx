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
import { BOOLEAN_OPTIONS, SOURCE_TYPES } from "@/lib/constants";
import { getErrorMessage } from "@/lib/api/query-utils";
import { createRouteStop, listRouteStops } from "@/lib/api/services";
import { queryKeys } from "@/types/query-keys";
import type { ColumnDef } from "@/types/table";
import type { RouteStop } from "@/types/domain";

const schema = z
  .object({
    route_id: z.string().uuid(),
    stop_sequence: z.coerce.number().int().positive(),
    source_type: z.string().min(1),
    household_id: z.string().uuid().optional().or(z.literal("")),
    bulk_generator_id: z.string().uuid().optional().or(z.literal("")),
    expected_time: z.string().optional(),
    is_active: z.boolean(),
  })
  .refine((data) => (data.source_type === "HOUSEHOLD" ? Boolean(data.household_id) : true), {
    message: "household_id is required for HOUSEHOLD",
    path: ["household_id"],
  })
  .refine((data) => (data.source_type === "BULK_GENERATOR" ? Boolean(data.bulk_generator_id) : true), {
    message: "bulk_generator_id is required for BULK_GENERATOR",
    path: ["bulk_generator_id"],
  });

const columns: ColumnDef<RouteStop>[] = [
  { key: "route", header: "Route ID", render: (row) => row.route_id },
  { key: "sequence", header: "Sequence", render: (row) => row.stop_sequence },
  { key: "source", header: "Source Type", render: (row) => <StatusBadge value={row.source_type} /> },
  { key: "sourceId", header: "Source ID", render: (row) => row.household_id ?? row.bulk_generator_id ?? "-" },
  { key: "time", header: "Expected Time", render: (row) => row.expected_time ?? "-" },
];

export default function RouteStopsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<"create" | "edit" | null>(null);
  const [selected, setSelected] = useState<RouteStop | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({
    route_id: "",
    stop_sequence: "",
    source_type: "HOUSEHOLD",
    household_id: "",
    bulk_generator_id: "",
    expected_time: "",
    is_active: true,
  });

  const query = useQuery({ queryKey: queryKeys.routeStops.list(), queryFn: () => listRouteStops() });
  const createMutation = useMutation({
    mutationFn: createRouteStop,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.routeStops.all });
      setMode(null);
      setFormError(null);
    },
  });

  const rows = useMemo(
    () =>
      (query.data ?? []).filter((row) =>
        [row.route_id, row.source_type, row.household_id ?? "", row.bulk_generator_id ?? ""].join(" ").toLowerCase().includes(search.toLowerCase()),
      ),
    [query.data, search],
  );

  function submitCreate() {
    const parsed = schema.safeParse({ ...form, stop_sequence: Number(form.stop_sequence) });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "Invalid form");
      return;
    }
    createMutation.mutate({
      ...parsed.data,
      household_id: parsed.data.household_id || null,
      bulk_generator_id: parsed.data.bulk_generator_id || null,
      expected_time: parsed.data.expected_time || null,
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Route Stops" description="Ordered stop registry for route execution." actions={<Button onClick={() => setMode("create")}>Create Route Stop</Button>} />
      <FilterBar onReset={() => setSearch("")}>
        <Input placeholder="Search route stop" value={search} onChange={(event) => setSearch(event.target.value)} />
      </FilterBar>
      <EntityTable
        columns={columns}
        rows={rows}
        isLoading={query.isLoading}
        isError={query.isError}
        errorMessage={getErrorMessage(query.error)}
        emptyTitle="No route stops found"
        emptyDescription="Create ordered route stops to operationalize routes."
        onRetry={() => void query.refetch()}
        rowActions={(row) => <RowActions row={row} viewHref={`/route-stops/${row.id}`} onEdit={(item) => { setSelected(item); setMode("edit"); }} />}
      />

      <EntityFormDrawer
        open={mode === "create" || mode === "edit"}
        onOpenChange={(open) => !open && setMode(null)}
        title={mode === "create" ? "Create Route Stop" : `Edit Stop ${selected?.id ?? ""}`}
        subtitle="Stop ordering and source linkage"
        mode={mode === "edit" ? "edit" : "create"}
        isSubmitting={createMutation.isPending}
        onSubmit={submitCreate}
      >
        <FieldGrid>
          <FormTextField label="Route ID" value={mode === "edit" ? selected?.route_id ?? "" : form.route_id} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, route_id: value }))} />
          <FormTextField label="Stop Sequence" type="number" value={mode === "edit" ? String(selected?.stop_sequence ?? "") : form.stop_sequence} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, stop_sequence: value }))} />
          <FormSelectField label="Source Type" value={mode === "edit" ? selected?.source_type ?? "HOUSEHOLD" : form.source_type} disabled={mode === "edit"} options={SOURCE_TYPES.map((item) => ({ label: item, value: item }))} onChange={(value) => setForm((prev) => ({ ...prev, source_type: value }))} />
          <FormTextField label="Household ID" value={mode === "edit" ? selected?.household_id ?? "" : form.household_id} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, household_id: value }))} />
          <FormTextField label="Bulk Generator ID" value={mode === "edit" ? selected?.bulk_generator_id ?? "" : form.bulk_generator_id} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, bulk_generator_id: value }))} />
          <FormTextField label="Expected Time" type="time" value={mode === "edit" ? selected?.expected_time ?? "" : form.expected_time} disabled={mode === "edit"} onChange={(value) => setForm((prev) => ({ ...prev, expected_time: value }))} />
          <FormSelectField label="Active" value={String(mode === "edit" ? selected?.is_active ?? false : form.is_active)} disabled={mode === "edit"} options={BOOLEAN_OPTIONS} onChange={(value) => setForm((prev) => ({ ...prev, is_active: value === "true" }))} />
        </FieldGrid>
        {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
        {createMutation.isError ? <p className="text-sm text-red-600">{getErrorMessage(createMutation.error)}</p> : null}
      </EntityFormDrawer>
    </div>
  );
}
