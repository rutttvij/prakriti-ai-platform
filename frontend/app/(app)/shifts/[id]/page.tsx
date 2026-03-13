"use client";

import Link from "next/link";
import { useMemo } from "react";
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
import { getShift, listPickupTasks } from "@/lib/api/services";
import { formatDate, formatDateTime } from "@/lib/utils";
import { queryKeys } from "@/types/query-keys";

export default function ShiftDetailPage() {
  const { id } = useParams<{ id: string }>();
  const query = useQuery({ queryKey: queryKeys.shifts.detail(id), queryFn: () => getShift(id) });
  const tasksQuery = useQuery({ queryKey: queryKeys.pickupTasks.list({ shift_id: id }), queryFn: () => listPickupTasks({ shift_id: id }) });

  const taskSummary = useMemo(() => {
    const tasks = tasksQuery.data ?? [];
    const completed = tasks.filter((task) => task.pickup_status === "COMPLETED").length;
    const inProgress = tasks.filter((task) => task.pickup_status === "IN_PROGRESS").length;
    const missed = tasks.filter((task) => task.pickup_status === "MISSED").length;
    return { total: tasks.length, completed, inProgress, missed };
  }, [tasksQuery.data]);

  if (query.isLoading) return <LoadingState title="Loading shift" description="Fetching shift schedule and assignments." />;
  if (query.isError || !query.data) return <ErrorState description={getErrorMessage(query.error)} onRetry={() => void query.refetch()} />;

  const data = query.data;

  return (
    <div className="space-y-6">
      <PageHeader title={data.name} description="Shift schedule and operational assignment context." actions={<Button variant="outline" asChild><Link href="/shifts">Back to Shifts</Link></Button>} />
      <EntityDetailsCard
        title="Shift Summary"
        items={[
          { label: "Shift ID", value: data.id },
          { label: "Date", value: formatDate(data.shift_date) },
          { label: "Time Window", value: `${data.start_time} - ${data.end_time}` },
          { label: "Status", value: <StatusBadge value={data.is_active ? "ACTIVE" : "INACTIVE"} /> },
          { label: "Supervisor User ID", value: data.supervisor_user_id ?? "-" },
        ]}
      />
      <EntityDetailsCard
        title="Operational Scope"
        items={[
          { label: "City ID", value: data.city_id },
          { label: "Ward ID", value: data.ward_id ?? "-" },
          { label: "Zone ID", value: data.zone_id ?? "-" },
          { label: "Created", value: formatDateTime(data.created_at) },
          { label: "Updated", value: formatDateTime(data.updated_at) },
        ]}
      />
      <EntityDetailsCard
        title="Linked Task Performance"
        items={[
          { label: "Total Tasks", value: taskSummary.total },
          { label: "Completed", value: taskSummary.completed },
          { label: "In Progress", value: taskSummary.inProgress },
          { label: "Missed", value: taskSummary.missed },
        ]}
      />
      <LinkedEntityCard
        title="Related Views"
        items={[
          { label: "Pickup Tasks", value: "Open tasks assigned to this shift", href: `/pickup-tasks` },
          { label: "Workers", value: "View worker profiles", href: "/workers" },
        ]}
      />
    </div>
  );
}
