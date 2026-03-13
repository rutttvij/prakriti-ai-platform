"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui-extensions/page-header";
import { StatusBadge } from "@/components/ui-extensions/status-badge";
import { listPickupTasks } from "@/lib/api/services";
import { formatDate, formatNumber } from "@/lib/utils";
import { queryKeys } from "@/types/query-keys";

export default function WorkerShiftsPage() {
  const tasksQuery = useQuery({ queryKey: queryKeys.pickupTasks.list(), queryFn: () => listPickupTasks() });

  const shifts = useMemo(() => {
    const byShift = new Map<string, { shiftId: string; taskCount: number; completed: number; scheduledDates: string[] }>();

    for (const task of tasksQuery.data ?? []) {
      if (!task.shift_id) continue;
      const existing = byShift.get(task.shift_id) ?? { shiftId: task.shift_id, taskCount: 0, completed: 0, scheduledDates: [] };
      existing.taskCount += 1;
      if (task.pickup_status === "COMPLETED") existing.completed += 1;
      existing.scheduledDates.push(task.scheduled_date);
      byShift.set(task.shift_id, existing);
    }

    return Array.from(byShift.values()).sort((a, b) => b.scheduledDates[0].localeCompare(a.scheduledDates[0]));
  }, [tasksQuery.data]);

  return (
    <div className="space-y-4">
      <PageHeader title="My Shifts" description="Shifts derived from your assigned pickup tasks." />
      <div className="space-y-3">
        {shifts.map((shift) => {
          const status = shift.completed === shift.taskCount ? "COMPLETED" : shift.completed > 0 ? "IN_PROGRESS" : "PENDING";
          return (
            <Card key={shift.shiftId}>
              <CardHeader>
                <CardTitle className="text-base">Shift {shift.shiftId}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-slate-700"><span className="text-slate-500">Tasks:</span> {formatNumber(shift.taskCount, 0)}</p>
                <p className="text-sm text-slate-700"><span className="text-slate-500">Completed:</span> {formatNumber(shift.completed, 0)}</p>
                <p className="text-sm text-slate-700"><span className="text-slate-500">Latest Date:</span> {formatDate(shift.scheduledDates[0])}</p>
                <StatusBadge value={status} />
              </CardContent>
            </Card>
          );
        })}
        {!shifts.length ? <p className="text-sm text-slate-500">No shifts assigned yet.</p> : null}
      </div>
    </div>
  );
}
