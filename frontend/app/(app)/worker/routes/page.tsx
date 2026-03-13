"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui-extensions/page-header";
import { listPickupTasks } from "@/lib/api/services";
import { formatDate, formatNumber } from "@/lib/utils";
import { queryKeys } from "@/types/query-keys";

export default function WorkerRoutesPage() {
  const tasksQuery = useQuery({ queryKey: queryKeys.pickupTasks.list(), queryFn: () => listPickupTasks() });

  const routes = useMemo(() => {
    const byRoute = new Map<string, { routeId: string; taskCount: number; latestDate: string }>();
    for (const task of tasksQuery.data ?? []) {
      if (!task.route_id) continue;
      const existing = byRoute.get(task.route_id) ?? { routeId: task.route_id, taskCount: 0, latestDate: task.scheduled_date };
      existing.taskCount += 1;
      if (task.scheduled_date > existing.latestDate) existing.latestDate = task.scheduled_date;
      byRoute.set(task.route_id, existing);
    }
    return Array.from(byRoute.values()).sort((a, b) => b.latestDate.localeCompare(a.latestDate));
  }, [tasksQuery.data]);

  return (
    <div className="space-y-4">
      <PageHeader title="My Routes" description="Routes inferred from your assigned tasks." />
      <div className="space-y-3">
        {routes.map((route) => (
          <Card key={route.routeId}>
            <CardHeader>
              <CardTitle className="text-base">Route {route.routeId}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm text-slate-700">
              <p><span className="text-slate-500">Assigned tasks:</span> {formatNumber(route.taskCount, 0)}</p>
              <p><span className="text-slate-500">Latest assignment:</span> {formatDate(route.latestDate)}</p>
            </CardContent>
          </Card>
        ))}
        {!routes.length ? <p className="text-sm text-slate-500">No routes assigned yet.</p> : null}
      </div>
    </div>
  );
}
