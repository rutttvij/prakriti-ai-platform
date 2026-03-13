"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { EntityDetailsCard } from "@/components/crud/entity-details-card";
import { LinkedEntityCard } from "@/components/operations/linked-entity-card";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui-extensions/error-state";
import { LoadingState } from "@/components/ui-extensions/loading-state";
import { PageHeader } from "@/components/ui-extensions/page-header";
import { StatusBadge } from "@/components/ui-extensions/status-badge";
import { getErrorMessage } from "@/lib/api/query-utils";
import { getRoute, getRouteStop } from "@/lib/api/services";
import { formatDateTime } from "@/lib/utils";
import { queryKeys } from "@/types/query-keys";

export default function RouteStopDetailPage() {
  const { id } = useParams<{ id: string }>();
  const query = useQuery({ queryKey: queryKeys.routeStops.detail(id), queryFn: () => getRouteStop(id) });
  const routeQuery = useQuery({
    queryKey: query.data?.route_id ? queryKeys.routes.detail(query.data.route_id) : ["routes", "detail", "unknown"],
    queryFn: () => getRoute(query.data!.route_id),
    enabled: Boolean(query.data?.route_id),
  });

  if (query.isLoading) return <LoadingState title="Loading route stop" description="Fetching stop order and source binding." />;
  if (query.isError || !query.data) return <ErrorState description={getErrorMessage(query.error)} onRetry={() => void query.refetch()} />;

  const data = query.data;

  return (
    <div className="space-y-6">
      <PageHeader title={`Route Stop ${data.stop_sequence}`} description="Stop definition and linked route context." actions={<Button variant="outline" asChild><Link href="/route-stops">Back to Route Stops</Link></Button>} />
      <EntityDetailsCard
        title="Stop Summary"
        items={[
          { label: "Stop ID", value: data.id },
          { label: "Route ID", value: data.route_id },
          { label: "Stop Sequence", value: data.stop_sequence },
          { label: "Source Type", value: <StatusBadge value={data.source_type} /> },
          { label: "Expected Time", value: data.expected_time ?? "-" },
          { label: "Status", value: <StatusBadge value={data.is_active ? "ACTIVE" : "INACTIVE"} /> },
        ]}
      />
      <EntityDetailsCard
        title="Source Linkage"
        items={[
          { label: "Household ID", value: data.household_id ?? "-" },
          { label: "Bulk Generator ID", value: data.bulk_generator_id ?? "-" },
          { label: "Created", value: formatDateTime(data.created_at) },
          { label: "Updated", value: formatDateTime(data.updated_at) },
        ]}
      />
      <EntityDetailsCard
        title="Ward / Zone Context"
        items={[
          { label: "Route Ward ID", value: routeQuery.data?.ward_id ?? "-" },
          { label: "Route Zone ID", value: routeQuery.data?.zone_id ?? "-" },
          { label: "Route Type", value: routeQuery.data ? <StatusBadge value={routeQuery.data.route_type} /> : "-" },
          { label: "Route Status", value: routeQuery.data ? <StatusBadge value={routeQuery.data.is_active ? "ACTIVE" : "INACTIVE"} /> : "-" },
        ]}
      />
      <LinkedEntityCard
        title="Related Views"
        items={[
          { label: "Route", value: data.route_id, href: `/routes/${data.route_id}` },
          { label: "Pickup Tasks", value: "View pickup task workflow", href: "/pickup-tasks" },
        ]}
      />
    </div>
  );
}
