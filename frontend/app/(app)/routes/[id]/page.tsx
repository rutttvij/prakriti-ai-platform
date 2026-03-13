"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { EntityDetailsCard } from "@/components/crud/entity-details-card";
import { LinkedEntityCard } from "@/components/operations/linked-entity-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ErrorState } from "@/components/ui-extensions/error-state";
import { LoadingState } from "@/components/ui-extensions/loading-state";
import { PageHeader } from "@/components/ui-extensions/page-header";
import { StatusBadge } from "@/components/ui-extensions/status-badge";
import { getErrorMessage } from "@/lib/api/query-utils";
import { getRoute, listPickupTasks, listRouteStops } from "@/lib/api/services";
import { formatDateTime } from "@/lib/utils";
import { queryKeys } from "@/types/query-keys";

export default function RouteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const query = useQuery({ queryKey: queryKeys.routes.detail(id), queryFn: () => getRoute(id) });
  const stopsQuery = useQuery({ queryKey: queryKeys.routeStops.list({ route_id: id }), queryFn: () => listRouteStops({ route_id: id }) });
  const tasksQuery = useQuery({ queryKey: queryKeys.pickupTasks.list({ route_id: id }), queryFn: () => listPickupTasks({ route_id: id }) });

  const orderedStops = useMemo(
    () => [...(stopsQuery.data ?? [])].sort((a, b) => a.stop_sequence - b.stop_sequence),
    [stopsQuery.data],
  );

  if (query.isLoading) return <LoadingState title="Loading route" description="Fetching route metadata and stop plan." />;
  if (query.isError || !query.data) return <ErrorState description={getErrorMessage(query.error)} onRetry={() => void query.refetch()} />;

  const data = query.data;

  return (
    <div className="space-y-6">
      <PageHeader title={data.route_code} description="Route metadata, stop ordering, and linked execution context." actions={<Button variant="outline" asChild><Link href="/routes">Back to Routes</Link></Button>} />

      <EntityDetailsCard
        title="Route Metadata"
        items={[
          { label: "Route ID", value: data.id },
          { label: "Route Code", value: data.route_code },
          { label: "Route Name", value: data.name },
          { label: "Route Type", value: <StatusBadge value={data.route_type} /> },
          { label: "Status", value: <StatusBadge value={data.is_active ? "ACTIVE" : "INACTIVE"} /> },
          { label: "Created", value: formatDateTime(data.created_at) },
          { label: "Updated", value: formatDateTime(data.updated_at) },
        ]}
      />

      <EntityDetailsCard
        title="Ward and Zone Context"
        items={[
          { label: "City ID", value: data.city_id },
          { label: "Ward ID", value: data.ward_id },
          { label: "Zone ID", value: data.zone_id ?? "-" },
          { label: "Total Stops", value: orderedStops.length },
          { label: "Linked Pickup Tasks", value: tasksQuery.data?.length ?? 0 },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ordered Route Stops</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sequence</TableHead>
                <TableHead>Source Type</TableHead>
                <TableHead>Source ID</TableHead>
                <TableHead>Expected Time</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orderedStops.map((stop) => (
                <TableRow key={stop.id}>
                  <TableCell>{stop.stop_sequence}</TableCell>
                  <TableCell><StatusBadge value={stop.source_type} /></TableCell>
                  <TableCell>{stop.household_id ?? stop.bulk_generator_id ?? "-"}</TableCell>
                  <TableCell>{stop.expected_time ?? "-"}</TableCell>
                  <TableCell><StatusBadge value={stop.is_active ? "ACTIVE" : "INACTIVE"} /></TableCell>
                </TableRow>
              ))}
              {!orderedStops.length ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-6 text-center text-sm text-slate-500">No route stops configured yet.</TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Related Pickup Tasks (Practical)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Scheduled Date</TableHead>
                <TableHead>Assigned Worker</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(tasksQuery.data ?? []).slice(0, 10).map((task) => (
                <TableRow key={task.id}>
                  <TableCell>
                    <Link className="text-emerald-700 underline" href={`/pickup-tasks/${task.id}`}>
                      {task.id}
                    </Link>
                  </TableCell>
                  <TableCell><StatusBadge value={task.pickup_status} /></TableCell>
                  <TableCell><StatusBadge value={task.source_type} /></TableCell>
                  <TableCell>{task.scheduled_date}</TableCell>
                  <TableCell>{task.assigned_worker_id ?? "-"}</TableCell>
                </TableRow>
              ))}
              {!(tasksQuery.data ?? []).length ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-6 text-center text-sm text-slate-500">No pickup tasks linked to this route yet.</TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <LinkedEntityCard
        title="Related Views"
        items={[
          { label: "Route Stops", value: "Open all route stops", href: "/route-stops" },
          { label: "Pickup Tasks", value: "Open all pickup tasks", href: "/pickup-tasks" },
          { label: "Shifts", value: "Open shift schedule", href: "/shifts" },
        ]}
      />
    </div>
  );
}
