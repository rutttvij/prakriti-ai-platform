"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { SeverityBadge } from "@/components/monitoring/severity-badge";
import { FormSelectField, FormTextField } from "@/components/forms/form-fields";
import { Card, CardContent } from "@/components/ui/card";
import { FilterBar } from "@/components/ui-extensions/filter-bar";
import { LoadingState } from "@/components/ui-extensions/loading-state";
import { ErrorState } from "@/components/ui-extensions/error-state";
import { PageHeader } from "@/components/ui-extensions/page-header";
import { StatusBadge } from "@/components/ui-extensions/status-badge";
import { useIssueStatusState } from "@/hooks/use-issue-status-state";
import { listCities, listWards, listZones } from "@/lib/api/services";
import { getMonitoringData } from "@/lib/monitoring/query";
import { applyMonitoringFilters, withStatusOverrides } from "@/lib/monitoring/utils";
import { formatDateTime } from "@/lib/utils";
import type { MonitoringFilters } from "@/types/monitoring";
import { queryKeys } from "@/types/query-keys";

const ALL = "all";

export default function ExceptionsPage() {
  const [cityId, setCityId] = useState(ALL);
  const [wardId, setWardId] = useState(ALL);
  const [zoneId, setZoneId] = useState(ALL);
  const [type, setType] = useState(ALL);
  const [severity, setSeverity] = useState<MonitoringFilters["severity"]>(ALL);
  const [status, setStatus] = useState<MonitoringFilters["status"]>(ALL);
  const [assignedOwner, setAssignedOwner] = useState(ALL);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const locationParams = useMemo(() => ({ city_id: cityId !== ALL ? cityId : undefined, ward_id: wardId !== ALL ? wardId : undefined, zone_id: zoneId !== ALL ? zoneId : undefined }), [cityId, wardId, zoneId]);
  const monitoringQuery = useQuery({ queryKey: ["monitoring", "bundle", "exceptions", locationParams], queryFn: () => getMonitoringData(locationParams), refetchInterval: 120000 });

  const citiesQuery = useQuery({ queryKey: queryKeys.cities.list(), queryFn: () => listCities() });
  const wardsQuery = useQuery({ queryKey: queryKeys.wards.list({ city_id: cityId !== ALL ? cityId : undefined }), queryFn: () => listWards({ city_id: cityId !== ALL ? cityId : undefined }) });
  const zonesQuery = useQuery({ queryKey: queryKeys.zones.list({ ward_id: wardId !== ALL ? wardId : undefined }), queryFn: () => listZones({ ward_id: wardId !== ALL ? wardId : undefined }) });

  const { statusMap } = useIssueStatusState("exceptions");

  const exceptionsWithStatus = useMemo(
    () => withStatusOverrides(monitoringQuery.data?.exceptions ?? [], statusMap),
    [monitoringQuery.data?.exceptions, statusMap],
  );

  const typeOptions = useMemo(() => Array.from(new Set(exceptionsWithStatus.map((item) => item.type))), [exceptionsWithStatus]);
  const ownerOptions = useMemo(() => Array.from(new Set(exceptionsWithStatus.map((item) => item.assigned_owner_id).filter((item): item is string => Boolean(item)))), [exceptionsWithStatus]);

  const filtered = useMemo(
    () => applyMonitoringFilters(exceptionsWithStatus, {
      type,
      severity,
      status,
      city_id: cityId,
      ward_id: wardId,
      zone_id: zoneId,
      assigned_owner_id: assignedOwner,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    }),
    [exceptionsWithStatus, type, severity, status, cityId, wardId, zoneId, assignedOwner, dateFrom, dateTo],
  );

  if (monitoringQuery.isLoading) {
    return <LoadingState title="Loading exceptions" description="Building exception queue from operational signals." />;
  }

  if (monitoringQuery.isError) {
    return <ErrorState title="Unable to load exceptions" description="Please retry." onRetry={() => void monitoringQuery.refetch()} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Exceptions" description="Review and resolve operational and verification exceptions." />

      <FilterBar onReset={() => {
        setCityId(ALL);
        setWardId(ALL);
        setZoneId(ALL);
        setType(ALL);
        setSeverity(ALL);
        setStatus(ALL);
        setAssignedOwner(ALL);
        setDateFrom("");
        setDateTo("");
      }}>
        <FormSelectField label="City" value={cityId} onChange={setCityId} options={[{ label: "All", value: ALL }, ...(citiesQuery.data ?? []).map((city) => ({ label: city.name, value: city.id }))]} />
        <FormSelectField label="Ward" value={wardId} onChange={setWardId} options={[{ label: "All", value: ALL }, ...(wardsQuery.data ?? []).map((ward) => ({ label: ward.name, value: ward.id }))]} />
        <FormSelectField label="Zone" value={zoneId} onChange={setZoneId} options={[{ label: "All", value: ALL }, ...(zonesQuery.data ?? []).map((zone) => ({ label: zone.name, value: zone.id }))]} />
        <FormSelectField label="Exception Type" value={type} onChange={setType} options={[{ label: "All", value: ALL }, ...typeOptions.map((item) => ({ label: item, value: item }))]} />
        <FormSelectField label="Severity" value={severity ?? ALL} onChange={(value) => setSeverity(value as MonitoringFilters["severity"])} options={[{ label: "All", value: ALL }, { label: "Critical", value: "CRITICAL" }, { label: "High", value: "HIGH" }, { label: "Medium", value: "MEDIUM" }, { label: "Low", value: "LOW" }]} />
        <FormSelectField label="Status" value={status ?? ALL} onChange={(value) => setStatus(value as MonitoringFilters["status"])} options={[{ label: "All", value: ALL }, { label: "Open", value: "OPEN" }, { label: "Acknowledged", value: "ACKNOWLEDGED" }, { label: "Escalated", value: "ESCALATED" }, { label: "Resolved", value: "RESOLVED" }]} />
        <FormSelectField label="Assigned Owner" value={assignedOwner} onChange={setAssignedOwner} options={[{ label: "All", value: ALL }, ...ownerOptions.map((item) => ({ label: item, value: item }))]} />
        <FormTextField label="Date From" type="date" value={dateFrom} onChange={setDateFrom} />
        <FormTextField label="Date To" type="date" value={dateTo} onChange={setDateTo} />
      </FilterBar>

      <div className="grid gap-4">
        {filtered.map((item) => (
          <Card key={item.id}>
            <CardContent className="space-y-3 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                <div className="flex items-center gap-2">
                  <SeverityBadge severity={item.severity} />
                  <StatusBadge value={item.status} />
                </div>
              </div>
              <p className="text-sm text-slate-700">{item.description}</p>
              <p className="text-xs text-slate-500">{formatDateTime(item.created_at)}</p>
              <p className="text-xs text-slate-600">Assigned Owner: {item.assigned_owner_id ?? "Unassigned"}</p>
              <p className="text-xs text-slate-600">Next Action: {item.recommended_action ?? "Review and update exception status."}</p>
              <Link href={`/exceptions/${encodeURIComponent(item.id)}`} className="text-sm font-medium text-emerald-700 hover:underline">Open exception</Link>
            </CardContent>
          </Card>
        ))}
        {!filtered.length ? <p className="text-sm text-slate-500">No exceptions found for selected filters.</p> : null}
      </div>
    </div>
  );
}
