import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui-extensions/status-badge";
import { formatDate } from "@/lib/utils";
import type { PickupTask } from "@/types/domain";

export function WorkerTaskCard({ task }: { task: PickupTask }) {
  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-slate-900">{task.id}</p>
          <StatusBadge value={task.pickup_status} />
        </div>
        <div className="space-y-1 text-sm text-slate-700">
          <p><span className="text-slate-500">Source:</span> {task.source_type}</p>
          <p><span className="text-slate-500">Date:</span> {formatDate(task.scheduled_date)}</p>
          <p><span className="text-slate-500">Route:</span> {task.route_id ?? "-"}</p>
          <p><span className="text-slate-500">Shift:</span> {task.shift_id ?? "-"}</p>
        </div>
        <Button asChild className="h-11 w-full text-base">
          <Link href={`/worker/tasks/${task.id}`}>Open Task</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
