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
import { getWorker } from "@/lib/api/services";
import { formatDate } from "@/lib/utils";
import { queryKeys } from "@/types/query-keys";

export default function WorkerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const query = useQuery({ queryKey: queryKeys.workers.detail(id), queryFn: () => getWorker(id) });

  if (query.isLoading) return <LoadingState title="Loading worker profile" description="Fetching worker attributes and scope." />;
  if (query.isError || !query.data) return <ErrorState description={getErrorMessage(query.error)} onRetry={() => void query.refetch()} />;

  const data = query.data;

  return (
    <div className="space-y-6">
      <PageHeader title={`Worker ${data.employee_code}`} description="Worker profile and employment status." actions={<Button variant="outline" asChild><Link href="/workers">Back to Workers</Link></Button>} />
      <EntityDetailsCard title="Summary" items={[{ label: "ID", value: data.id }, { label: "User ID", value: data.user_id }, { label: "Employee Code", value: data.employee_code }, { label: "Designation", value: data.designation }, { label: "Employment", value: <StatusBadge value={data.employment_status} /> }, { label: "Status", value: <StatusBadge value={data.is_active ? "ACTIVE" : "INACTIVE"} /> }]} />
      <EntityDetailsCard title="Hierarchy" items={[{ label: "City ID", value: data.city_id }, { label: "Ward ID", value: data.ward_id ?? "-" }, { label: "Zone ID", value: data.zone_id ?? "-" }]} />
      <EntityDetailsCard title="Timeline and Links" items={[{ label: "Joined On", value: formatDate(data.joined_on) }, { label: "Created", value: formatDate(data.created_at) }, { label: "Updated", value: formatDate(data.updated_at) }, { label: "Pickup Tasks", value: <Link className="text-emerald-700 underline" href="/pickup-tasks">View pickup assignments</Link> }]} />
    </div>
  );
}
