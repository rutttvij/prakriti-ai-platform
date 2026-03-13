"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { EntityDetailsCard } from "@/components/crud/entity-details-card";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui-extensions/error-state";
import { LoadingState } from "@/components/ui-extensions/loading-state";
import { PageHeader } from "@/components/ui-extensions/page-header";
import { StatusBadge } from "@/components/ui-extensions/status-badge";
import { getErrorMessage } from "@/lib/api/query-utils";
import { getFacility } from "@/lib/api/services";
import { formatDate } from "@/lib/utils";
import { queryKeys } from "@/types/query-keys";

export default function FacilityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const query = useQuery({ queryKey: queryKeys.facilities.detail(id), queryFn: () => getFacility(id) });

  if (query.isLoading) return <LoadingState title="Loading facility" description="Fetching facility profile and hierarchy." />;
  if (query.isError || !query.data) return <ErrorState description={getErrorMessage(query.error)} onRetry={() => void query.refetch()} />;

  const data = query.data;

  return (
    <div className="space-y-6">
      <PageHeader title={data.name} description="Facility detail and processing profile." actions={<Button variant="outline" asChild><Link href="/facilities">Back to Facilities</Link></Button>} />
      <EntityDetailsCard title="Summary" items={[{ label: "ID", value: data.id }, { label: "Facility Code", value: data.facility_code }, { label: "Type", value: <StatusBadge value={data.facility_type} /> }, { label: "Operator", value: data.operator_name ?? "-" }, { label: "License", value: data.license_number ?? "-" }, { label: "Status", value: <StatusBadge value={data.is_active ? "ACTIVE" : "INACTIVE"} /> }]} />
      <EntityDetailsCard title="Hierarchy" items={[{ label: "City ID", value: data.city_id }, { label: "Ward ID", value: data.ward_id ?? "-" }, { label: "Zone ID", value: data.zone_id ?? "-" }, { label: "Address ID", value: data.address_id ?? "-" }]} />
      <EntityDetailsCard title="Capacity and Timeline" items={[{ label: "Capacity (kg/day)", value: data.capacity_kg_per_day ?? "-" }, { label: "Created", value: formatDate(data.created_at) }, { label: "Updated", value: formatDate(data.updated_at) }, { label: "Related Routes", value: <Link className="text-emerald-700 underline" href="/routes">Open routes</Link> }]} />
    </div>
  );
}
