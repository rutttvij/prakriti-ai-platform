"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { WorkerStatGrid } from "@/components/worker/stat-grid";
import { WorkerTaskCard } from "@/components/worker/task-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui-extensions/page-header";
import { listPickupTasks } from "@/lib/api/services";
import { formatDate, formatNumber } from "@/lib/utils";
import { queryKeys } from "@/types/query-keys";

export default function WorkerHomePage() {
  const today = new Date().toISOString().slice(0, 10);

  const tasksQuery = useQuery({
    queryKey: queryKeys.pickupTasks.list({ scheduled_date: today }),
    queryFn: () => listPickupTasks({ scheduled_date: today }),
  });

  const quickStats = useMemo(() => {
    const tasks = tasksQuery.data ?? [];
    const total = tasks.length;
    const pending = tasks.filter((task) => task.pickup_status === "PENDING").length;
    const inProgress = tasks.filter((task) => task.pickup_status === "IN_PROGRESS").length;
    const completed = tasks.filter((task) => task.pickup_status === "COMPLETED").length;
    return { total, pending, inProgress, completed };
  }, [tasksQuery.data]);

  const tasks = tasksQuery.data ?? [];

  const activeShift = tasks.find((task) => task.pickup_status === "IN_PROGRESS" || task.pickup_status === "PENDING")?.shift_id ?? null;
  const todaysRoute = tasks.find((task) => task.route_id)?.route_id ?? null;

  return (
    <div className="space-y-4">
      <PageHeader title="Worker Dashboard" description={`Today: ${formatDate(today)}`} />

      <WorkerStatGrid
        items={[
          { label: "Assigned", value: formatNumber(quickStats.total, 0) },
          { label: "Pending", value: formatNumber(quickStats.pending, 0) },
          { label: "In Progress", value: formatNumber(quickStats.inProgress, 0) },
          { label: "Completed", value: formatNumber(quickStats.completed, 0) },
        ]}
      />

      <div className="grid gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Active Shift</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{activeShift ?? "No active shift"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Today&apos;s Route</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{todaysRoute ?? "No route assigned"}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button asChild className="h-12 text-base"><Link href="/worker/shifts">My Shifts</Link></Button>
        <Button asChild className="h-12 text-base" variant="outline"><Link href="/worker/routes">My Routes</Link></Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Assigned Tasks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-4">
          {tasks.slice(0, 5).map((task) => (
            <WorkerTaskCard key={task.id} task={task} />
          ))}
          {!tasks.length ? <p className="text-sm text-slate-500">No assigned tasks for today.</p> : null}
          {tasks.length > 5 ? (
            <Button asChild className="h-11 w-full text-base" variant="outline">
              <Link href="/worker/tasks">View All Tasks</Link>
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
