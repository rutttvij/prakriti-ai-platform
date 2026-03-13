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
import { getBulkGenerator } from "@/lib/api/services";
import { formatDate } from "@/lib/utils";
import { queryKeys } from "@/types/query-keys";

export default function BulkGeneratorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const query = useQuery({ queryKey: queryKeys.bulkGenerators.detail(id), queryFn: () => getBulkGenerator(id) });

  if (query.isLoading) return <LoadingState title="Loading bulk generator" description="Fetching generator profile and compliance status." />;
  if (query.isError || !query.data) return <ErrorState description={getErrorMessage(query.error)} onRetry={() => void query.refetch()} />;

  const data = query.data;

  return (
    <div className="space-y-6">
      <PageHeader title={data.entity_name} description="Bulk generator detail profile." actions={<Button variant="outline" asChild><Link href="/bulk-generators">Back to Generators</Link></Button>} />
      <EntityDetailsCard title="Summary" items={[{ label: "ID", value: data.id }, { label: "Generator Code", value: data.generator_code }, { label: "Type", value: <StatusBadge value={data.generator_type} /> }, { label: "Compliance", value: <StatusBadge value={data.compliance_status} /> }, { label: "Onboarding", value: <StatusBadge value={data.onboarding_status} /> }, { label: "Status", value: <StatusBadge value={data.is_active ? "ACTIVE" : "INACTIVE"} /> }]} />
      <EntityDetailsCard title="Hierarchy" items={[{ label: "Organization ID", value: data.organization_id ?? "-" }, { label: "City ID", value: data.city_id }, { label: "Ward ID", value: data.ward_id }, { label: "Zone ID", value: data.zone_id ?? "-" }]} />
      <EntityDetailsCard title="Contacts and Metrics" items={[{ label: "Contact Person", value: data.contact_person_name }, { label: "Phone", value: data.contact_phone }, { label: "Email", value: data.contact_email ?? "-" }, { label: "Estimated Daily Waste (kg)", value: data.estimated_daily_waste_kg ?? "-" }, { label: "Created", value: formatDate(data.created_at) }, { label: "Updated", value: formatDate(data.updated_at) }]} />
      <EntityDetailsCard title="Related Links" items={[{ label: "Pickup Tasks", value: <Link className="text-emerald-700 underline" href="/pickup-tasks">Open pickup tasks</Link> }, { label: "Reports", value: <Link className="text-emerald-700 underline" href="/reports">Open reports</Link> }]} />
    </div>
  );
}
