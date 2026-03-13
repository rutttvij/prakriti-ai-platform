"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/ui-extensions/page-header";
import { StatusBadge } from "@/components/ui-extensions/status-badge";
import { PICKUP_EVENT_TYPES, WASTE_CATEGORIES } from "@/lib/constants";
import { getErrorMessage } from "@/lib/api/query-utils";
import { completePickupTask, createPickupLog, getPickupTask, listPickupLogs, listWorkers, missPickupTask, startPickupTask } from "@/lib/api/services";
import { formatDate, formatDateTime, formatNumber } from "@/lib/utils";
import { queryKeys } from "@/types/query-keys";

export default function WorkerTaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [actualWeight, setActualWeight] = useState("");
  const [contamination, setContamination] = useState(false);
  const [wasteCategory, setWasteCategory] = useState("WET");
  const [notes, setNotes] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [missNotes, setMissNotes] = useState("");

  const taskQuery = useQuery({ queryKey: queryKeys.pickupTasks.detail(id), queryFn: () => getPickupTask(id) });
  const logsQuery = useQuery({ queryKey: queryKeys.pickupLogs.list({ pickup_task_id: id }), queryFn: () => listPickupLogs({ pickup_task_id: id }) });
  const workerQuery = useQuery({ queryKey: queryKeys.workers.list(), queryFn: () => listWorkers() });

  const workerProfileId = workerQuery.data?.[0]?.id;

  async function invalidateAll() {
    await queryClient.invalidateQueries({ queryKey: queryKeys.pickupTasks.detail(id) });
    await queryClient.invalidateQueries({ queryKey: queryKeys.pickupTasks.all });
    await queryClient.invalidateQueries({ queryKey: queryKeys.pickupLogs.all });
  }

  const startMutation = useMutation({
    mutationFn: () => startPickupTask(id, { notes: "Task started from worker app" }),
    onSuccess: async () => {
      await invalidateAll();
      toast.success("Task started");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const completeMutation = useMutation({
    mutationFn: () =>
      completePickupTask(id, {
        actual_weight_kg: actualWeight ? Number(actualWeight) : null,
        waste_category: wasteCategory,
        contamination_flag: contamination,
        notes: notes || null,
        photo_url: photoUrl || null,
      }),
    onSuccess: async () => {
      await invalidateAll();
      toast.success("Task completed");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const missMutation = useMutation({
    mutationFn: () => missPickupTask(id, { notes: missNotes || "Marked missed from worker app", photo_url: photoUrl || null }),
    onSuccess: async () => {
      await invalidateAll();
      toast.success("Task marked missed");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const qrMutation = useMutation({
    mutationFn: async () => {
      if (!workerProfileId) throw new Error("Worker profile not found");
      return createPickupLog({
        pickup_task_id: id,
        worker_profile_id: workerProfileId,
        event_type: PICKUP_EVENT_TYPES.includes("NOTE_ADDED") ? "NOTE_ADDED" : "TASK_STARTED",
        notes: "QR scanned (placeholder)",
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.pickupLogs.all });
      toast.success("QR scan recorded");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const canStart = taskQuery.data?.pickup_status === "PENDING";
  const canComplete = taskQuery.data?.pickup_status === "IN_PROGRESS";
  const canMiss = taskQuery.data?.pickup_status !== "COMPLETED" && taskQuery.data?.pickup_status !== "MISSED";

  const timeline = useMemo(() => logsQuery.data ?? [], [logsQuery.data]);

  return (
    <div className="space-y-4">
      <PageHeader title="Task Detail" description={id} actions={<Button asChild variant="outline" className="h-11"><Link href="/worker/tasks">Back</Link></Button>} />

      {taskQuery.data ? (
        <>
          <Card>
            <CardContent className="space-y-2 p-4 text-sm text-slate-700">
              <div className="flex items-center justify-between"><p className="font-semibold text-slate-900">Status</p><StatusBadge value={taskQuery.data.pickup_status} /></div>
              <p><span className="text-slate-500">Source:</span> {taskQuery.data.source_type}</p>
              <p><span className="text-slate-500">Household ID:</span> {taskQuery.data.household_id ?? "-"}</p>
              <p><span className="text-slate-500">Bulk Generator ID:</span> {taskQuery.data.bulk_generator_id ?? "-"}</p>
              <p><span className="text-slate-500">Scheduled:</span> {formatDate(taskQuery.data.scheduled_date)}</p>
              <p><span className="text-slate-500">Expected Weight:</span> {formatNumber(taskQuery.data.expected_weight_kg)} kg</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">QR Scan</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-slate-600">Placeholder scanner UI. Use this button to simulate QR tag scan.</p>
              <Button className="h-12 w-full text-base" onClick={() => qrMutation.mutate()} disabled={qrMutation.isPending}>Simulate QR Scan</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Task Actions</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3">
                <Button className="h-12 text-base" onClick={() => startMutation.mutate()} disabled={!canStart || startMutation.isPending}>Start Task</Button>
              </div>

              <div className="space-y-2 rounded-md border border-slate-200 p-3">
                <p className="text-sm font-semibold text-slate-900">Complete Task</p>
                <div className="space-y-2">
                  <Label>Actual Weight (kg)</Label>
                  <Input className="h-11" type="number" value={actualWeight} onChange={(event) => setActualWeight(event.target.value)} />
                  <Label>Waste Category</Label>
                  <select className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm" value={wasteCategory} onChange={(event) => setWasteCategory(event.target.value)}>
                    {WASTE_CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                  <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={contamination} onChange={(event) => setContamination(event.target.checked)} /> Mark contamination</label>
                  <Label>Notes</Label>
                  <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Add completion notes" />
                  <Label>Proof Photo URL</Label>
                  <Input className="h-11" value={photoUrl} onChange={(event) => setPhotoUrl(event.target.value)} placeholder="https://..." />
                </div>
                <Button className="h-12 w-full text-base" onClick={() => completeMutation.mutate()} disabled={!canComplete || completeMutation.isPending}>Complete Task</Button>
              </div>

              <div className="space-y-2 rounded-md border border-red-200 p-3">
                <p className="text-sm font-semibold text-red-700">Mark Missed</p>
                <Textarea value={missNotes} onChange={(event) => setMissNotes(event.target.value)} placeholder="Reason for missed task" />
                <Button className="h-12 w-full text-base" variant="destructive" onClick={() => missMutation.mutate()} disabled={!canMiss || missMutation.isPending}>Mark Task Missed</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Pickup Logs</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {timeline.map((log) => (
                <div key={log.id} className="rounded-md border border-slate-200 px-3 py-2 text-sm">
                  <div className="flex items-center justify-between"><p className="font-medium text-slate-900">{log.event_type}</p><p className="text-xs text-slate-500">{formatDateTime(log.event_at)}</p></div>
                  <p className="text-slate-600">Worker: {log.worker_profile_id}</p>
                  <p className="text-slate-600">Weight: {formatNumber(log.weight_kg)} kg</p>
                  <p className="text-slate-600">Notes: {log.notes ?? "-"}</p>
                </div>
              ))}
              {!timeline.length ? <p className="text-sm text-slate-500">No logs yet.</p> : null}
            </CardContent>
          </Card>
        </>
      ) : null}

      {taskQuery.isError ? <p className="text-sm text-red-600">{getErrorMessage(taskQuery.error)}</p> : null}
    </div>
  );
}
