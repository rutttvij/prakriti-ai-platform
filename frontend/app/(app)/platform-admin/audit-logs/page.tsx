"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { FormSelectField, FormTextField } from "@/components/forms/form-fields";
import { AuditLogTable } from "@/components/platform-admin/audit-log-table";
import { PlatformAdminGuard } from "@/components/platform-admin/platform-admin-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/ui-extensions/error-state";
import { FilterBar } from "@/components/ui-extensions/filter-bar";
import { LoadingState } from "@/components/ui-extensions/loading-state";
import { PageHeader } from "@/components/ui-extensions/page-header";
import { getPlatformAuditLogs, getPlatformTenants, listCities, listUsers } from "@/lib/api/services";
import { formatDateTime } from "@/lib/utils";
import { queryKeys } from "@/types/query-keys";
import type { PlatformAuditLogRecord } from "@/types/platform-admin";

const ALL = "all";

export default function PlatformAuditLogsPage() {
  const [actorId, setActorId] = useState(ALL);
  const [entityType, setEntityType] = useState(ALL);
  const [action, setAction] = useState(ALL);
  const [tenantId, setTenantId] = useState(ALL);
  const [cityId, setCityId] = useState(ALL);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selected, setSelected] = useState<PlatformAuditLogRecord | null>(null);

  const usersQuery = useQuery({ queryKey: queryKeys.users.list(), queryFn: () => listUsers() });
  const tenantsQuery = useQuery({ queryKey: queryKeys.platformAdmin.tenants, queryFn: () => getPlatformTenants() });
  const citiesQuery = useQuery({ queryKey: queryKeys.cities.list(), queryFn: () => listCities() });

  const params = useMemo(
    () => ({
      actor_user_id: actorId !== ALL ? actorId : undefined,
      entity_type: entityType !== ALL ? entityType : undefined,
      action: action !== ALL ? action : undefined,
      tenant_id: tenantId !== ALL ? tenantId : undefined,
      city_id: cityId !== ALL ? cityId : undefined,
      date_from: dateFrom ? `${dateFrom}T00:00:00+00:00` : undefined,
      date_to: dateTo ? `${dateTo}T23:59:59+00:00` : undefined,
      limit: 250,
    }),
    [actorId, entityType, action, tenantId, cityId, dateFrom, dateTo],
  );

  const logsQuery = useQuery({
    queryKey: queryKeys.platformAdmin.auditLogs(params),
    queryFn: () => getPlatformAuditLogs(params),
    refetchInterval: 120000,
  });

  const entityOptions = useMemo(() => {
    const values = Array.from(new Set((logsQuery.data ?? []).map((item) => item.entity_type)));
    return [{ label: "All", value: ALL }, ...values.map((value) => ({ label: value, value }))];
  }, [logsQuery.data]);

  return (
    <PlatformAdminGuard>
      {logsQuery.isLoading ? (
        <LoadingState title="Loading audit logs" description="Collecting platform activity timeline." />
      ) : logsQuery.isError ? (
        <ErrorState title="Unable to load audit logs" description="Please retry." onRetry={() => void logsQuery.refetch()} />
      ) : (
        <div className="space-y-6">
          <PageHeader
            title="Platform Audit Logs"
            description="Review actor-level platform activity with tenant and city scope filters."
          />

          <FilterBar
            onReset={() => {
              setActorId(ALL);
              setEntityType(ALL);
              setAction(ALL);
              setTenantId(ALL);
              setCityId(ALL);
              setDateFrom("");
              setDateTo("");
              setSelected(null);
            }}
          >
            <FormSelectField
              label="Actor"
              value={actorId}
              onChange={setActorId}
              options={[
                { label: "All", value: ALL },
                ...((usersQuery.data ?? []).map((user) => ({ label: `${user.full_name} (${user.email})`, value: user.id }))),
              ]}
            />
            <FormSelectField label="Entity Type" value={entityType} onChange={setEntityType} options={entityOptions} />
            <FormSelectField
              label="Action"
              value={action}
              onChange={setAction}
              options={[
                { label: "All", value: ALL },
                { label: "Created", value: "CREATED" },
                { label: "Updated", value: "UPDATED" },
              ]}
            />
            <FormSelectField
              label="Tenant"
              value={tenantId}
              onChange={setTenantId}
              options={[{ label: "All", value: ALL }, ...((tenantsQuery.data ?? []).map((item) => ({ label: item.name, value: item.id })))]}
            />
            <FormSelectField
              label="City"
              value={cityId}
              onChange={setCityId}
              options={[{ label: "All", value: ALL }, ...((citiesQuery.data ?? []).map((item) => ({ label: item.name, value: item.id })))]}
            />
            <FormTextField label="Date From" type="date" value={dateFrom} onChange={setDateFrom} />
            <FormTextField label="Date To" type="date" value={dateTo} onChange={setDateTo} />
          </FilterBar>

          <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
            <AuditLogTable rows={logsQuery.data ?? []} onSelect={setSelected} />

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Log Detail</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-700">
                {selected ? (
                  <>
                    <p><span className="text-slate-500">Occurred:</span> {formatDateTime(selected.occurred_at)}</p>
                    <p><span className="text-slate-500">Action:</span> {selected.action}</p>
                    <p><span className="text-slate-500">Entity:</span> {selected.entity_type}</p>
                    <p><span className="text-slate-500">Entity Label:</span> {selected.entity_label}</p>
                    <p><span className="text-slate-500">Actor:</span> {selected.actor_name ?? selected.actor_user_id ?? "System"}</p>
                    <p><span className="text-slate-500">Tenant:</span> {selected.tenant_id ?? "-"}</p>
                    <p><span className="text-slate-500">City:</span> {selected.city_id ?? "-"}</p>
                    <p><span className="text-slate-500">Details:</span> {selected.details ?? "-"}</p>
                  </>
                ) : (
                  <p className="text-slate-500">Select a row to view detailed metadata.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </PlatformAdminGuard>
  );
}
