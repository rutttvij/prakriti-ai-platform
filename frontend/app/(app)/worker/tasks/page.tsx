"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { WorkerTaskCard } from "@/components/worker/task-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui-extensions/page-header";
import { listPickupTasks } from "@/lib/api/services";
import { queryKeys } from "@/types/query-keys";

export default function WorkerTasksPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const tasksQuery = useQuery({
    queryKey: queryKeys.pickupTasks.list({ pickup_status: status === "all" ? undefined : status }),
    queryFn: () => listPickupTasks({ pickup_status: status === "all" ? undefined : status }),
  });

  const filteredTasks = useMemo(
    () =>
      (tasksQuery.data ?? []).filter((task) =>
        JSON.stringify(task).toLowerCase().includes(search.toLowerCase()),
      ),
    [search, tasksQuery.data],
  );

  return (
    <div className="space-y-4">
      <PageHeader title="My Tasks" description="Assigned pickup tasks with simple mobile workflow." />

      <div className="grid grid-cols-2 gap-2">
        <Input placeholder="Search task" value={search} onChange={(event) => setSearch(event.target.value)} className="col-span-2 h-11" />
        <Button className="h-11" variant={status === "all" ? "primary" : "secondary"} onClick={() => setStatus("all")}>
          All
        </Button>
        <Button className="h-11" variant={status === "PENDING" ? "primary" : "secondary"} onClick={() => setStatus("PENDING")}>
          Pending
        </Button>
        <Button className="h-11" variant={status === "IN_PROGRESS" ? "primary" : "secondary"} onClick={() => setStatus("IN_PROGRESS")}>
          In Progress
        </Button>
        <Button className="h-11" variant={status === "COMPLETED" ? "primary" : "secondary"} onClick={() => setStatus("COMPLETED")}>
          Completed
        </Button>
      </div>

      <div className="space-y-3">
        {filteredTasks.map((task) => (
          <WorkerTaskCard key={task.id} task={task} />
        ))}
        {!filteredTasks.length ? <p className="text-sm text-slate-500">No assigned tasks found.</p> : null}
      </div>
    </div>
  );
}
