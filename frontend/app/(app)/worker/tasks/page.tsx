"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { WorkerTaskCard } from "@/components/worker/task-card";
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
        <button className={`h-11 rounded-md border text-sm font-medium ${status === "all" ? "bg-emerald-600 text-white" : "bg-white text-slate-700"}`} onClick={() => setStatus("all")}>All</button>
        <button className={`h-11 rounded-md border text-sm font-medium ${status === "PENDING" ? "bg-emerald-600 text-white" : "bg-white text-slate-700"}`} onClick={() => setStatus("PENDING")}>Pending</button>
        <button className={`h-11 rounded-md border text-sm font-medium ${status === "IN_PROGRESS" ? "bg-emerald-600 text-white" : "bg-white text-slate-700"}`} onClick={() => setStatus("IN_PROGRESS")}>In Progress</button>
        <button className={`h-11 rounded-md border text-sm font-medium ${status === "COMPLETED" ? "bg-emerald-600 text-white" : "bg-white text-slate-700"}`} onClick={() => setStatus("COMPLETED")}>Completed</button>
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
