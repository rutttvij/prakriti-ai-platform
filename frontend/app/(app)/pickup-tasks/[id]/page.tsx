"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { EntityDetailsCard } from "@/components/crud/entity-details-card";
import { FieldGrid } from "@/components/crud/field-grid";
import { FormSelectField, FormTextField, FormTextareaField } from "@/components/forms/form-fields";
import { ActivityTimeline } from "@/components/operations/activity-timeline";
import { AssignmentInfoCard } from "@/components/operations/assignment-info-card";
import { LifecycleStatusPanel } from "@/components/operations/lifecycle-status-panel";
import { LinkedEntityCard } from "@/components/operations/linked-entity-card";
import { TaskActionBar } from "@/components/operations/task-action-bar";
import { WeightSummaryCard } from "@/components/operations/weight-summary-card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/ui-extensions/error-state";
import { LoadingState } from "@/components/ui-extensions/loading-state";
import { PageHeader } from "@/components/ui-extensions/page-header";
import { StatusBadge } from "@/components/ui-extensions/status-badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { WASTE_CATEGORIES } from "@/lib/constants";
import { getErrorMessage } from "@/lib/api/query-utils";
import { completePickupTask, getPickupTask, listPickupLogs, missPickupTask, startPickupTask } from "@/lib/api/services";
import { formatDate, formatDateTime } from "@/lib/utils";
import { queryKeys } from "@/types/query-keys";

export default function PickupTaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [action, setAction] = useState<"start" | "miss" | null>(null);
  const [isCompleteOpen, setIsCompleteOpen] = useState(false);
  const [missNotes, setMissNotes] = useState("");
  const [completeForm, setCompleteForm] = useState({
    actual_weight_kg: "",
    waste_category: "WET",
    contamination_flag: "false",
    notes: "",
    photo_url: "",
  });

  const query = useQuery({ queryKey: queryKeys.pickupTasks.detail(id), queryFn: () => getPickupTask(id) });
  const logsQuery = useQuery({ queryKey: queryKeys.pickupLogs.list({ pickup_task_id: id }), queryFn: () => listPickupLogs({ pickup_task_id: id }) });

  async function invalidateTaskQueries() {
    await queryClient.invalidateQueries({ queryKey: queryKeys.pickupTasks.detail(id) });
    await queryClient.invalidateQueries({ queryKey: queryKeys.pickupTasks.all });
    await queryClient.invalidateQueries({ queryKey: queryKeys.pickupLogs.all });
  }

  const startMutation = useMutation({
    mutationFn: () => startPickupTask(id, {}),
    onSuccess: async (response) => {
      await invalidateTaskQueries();
      setAction(null);
      toast.success(response.message || "Pickup task started");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const completeMutation = useMutation({
    mutationFn: () =>
      completePickupTask(id, {
        actual_weight_kg: completeForm.actual_weight_kg ? Number(completeForm.actual_weight_kg) : null,
        waste_category: completeForm.waste_category || null,
        contamination_flag: completeForm.contamination_flag === "true",
        notes: completeForm.notes || null,
        photo_url: completeForm.photo_url || null,
      }),
    onSuccess: async (response) => {
      await invalidateTaskQueries();
      setIsCompleteOpen(false);
      toast.success(response.message || "Pickup task completed");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const missMutation = useMutation({
    mutationFn: () => missPickupTask(id, { notes: missNotes || "Marked missed from admin panel" }),
    onSuccess: async (response) => {
      await invalidateTaskQueries();
      setAction(null);
      setMissNotes("");
      toast.success(response.message || "Pickup task marked as missed");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const timelineItems = useMemo(
    () =>
      (logsQuery.data ?? []).map((log) => ({
        id: log.id,
        eventType: log.event_type,
        occurredAt: log.event_at,
        actor: log.worker_profile_id,
        notes: log.notes,
        weightKg: log.weight_kg,
        photoUrl: log.photo_url,
      })),
    [logsQuery.data],
  );

  if (query.isLoading) return <LoadingState title="Loading pickup task" description="Fetching assignment, status, and activity timeline." />;
  if (query.isError || !query.data) return <ErrorState description={getErrorMessage(query.error)} onRetry={() => void query.refetch()} />;

  const data = query.data;
  const isPending = data.pickup_status === "PENDING";
  const isInProgress = data.pickup_status === "IN_PROGRESS";
  const isClosed = data.pickup_status === "COMPLETED" || data.pickup_status === "MISSED" || data.pickup_status === "CANCELLED";
  const isMutating = startMutation.isPending || completeMutation.isPending || missMutation.isPending;

  return (
    <div className="space-y-6">
      <PageHeader title={`Pickup Task ${data.id}`} description="Operational workflow detail with lifecycle actions and event audit trail." actions={<Button variant="outline" asChild><Link href="/pickup-tasks">Back to Tasks</Link></Button>} />

      <LifecycleStatusPanel
        status={data.pickup_status}
        summary={[
          { label: "Scheduled Date", value: formatDate(data.scheduled_date) },
          { label: "Scheduled Window", value: `${data.scheduled_time_window_start ?? "-"} - ${data.scheduled_time_window_end ?? "-"}` },
          { label: "Actual Start", value: formatDateTime(data.actual_start_at) },
          { label: "Actual Completed", value: formatDateTime(data.actual_completed_at) },
        ]}
      />

      <TaskActionBar
        onStart={() => setAction("start")}
        onComplete={() => setIsCompleteOpen(true)}
        onMiss={() => setAction("miss")}
        disableStart={!isPending}
        disableComplete={!isInProgress}
        disableMiss={isClosed}
        loading={isMutating}
      />

      <WeightSummaryCard expectedWeightKg={data.expected_weight_kg} actualWeightKg={data.actual_weight_kg} />

      <AssignmentInfoCard
        workerId={data.assigned_worker_id}
        vehicleId={data.assigned_vehicle_id}
        routeId={data.route_id}
        routeStopId={data.route_stop_id}
        shiftId={data.shift_id}
      />

      <EntityDetailsCard
        title="Source Summary"
        items={[
          { label: "Source Type", value: <StatusBadge value={data.source_type} /> },
          { label: "Household ID", value: data.household_id ?? "-" },
          { label: "Bulk Generator ID", value: data.bulk_generator_id ?? "-" },
          { label: "Waste Category", value: data.waste_category ?? "-" },
          { label: "Contamination Flag", value: data.contamination_flag ? "Yes" : "No" },
          { label: "Proof Photo", value: data.proof_photo_url ? <a href={data.proof_photo_url} className="text-emerald-700 underline" target="_blank" rel="noreferrer">Open</a> : "-" },
        ]}
      />

      <EntityDetailsCard
        title="Schedule vs Actual"
        items={[
          { label: "Scheduled Date", value: formatDate(data.scheduled_date) },
          { label: "Window Start", value: data.scheduled_time_window_start ?? "-" },
          { label: "Window End", value: data.scheduled_time_window_end ?? "-" },
          { label: "Actual Start", value: formatDateTime(data.actual_start_at) },
          { label: "Actual Complete", value: formatDateTime(data.actual_completed_at) },
          { label: "Notes", value: data.notes ?? "-" },
        ]}
      />

      <LinkedEntityCard
        title="Linked Records"
        items={[
          { label: "Route", value: data.route_id ?? "-", href: data.route_id ? `/routes/${data.route_id}` : undefined },
          { label: "Shift", value: data.shift_id ?? "-", href: data.shift_id ? `/shifts/${data.shift_id}` : undefined },
          { label: "Pickup Logs", value: "Open pickup logs list", href: "/pickup-logs" },
        ]}
      />

      <ActivityTimeline title="Pickup Activity Timeline" items={timelineItems} />

      <ConfirmDialog
        open={action !== null}
        onOpenChange={(open) => !open && setAction(null)}
        title={action === "start" ? "Start pickup task" : "Mark task as missed"}
        description={action === "start" ? "This changes task status to IN_PROGRESS." : "This changes task status to MISSED."}
        confirmLabel={action === "start" ? "Start Task" : "Mark Missed"}
        isLoading={isMutating}
        onConfirm={() => {
          if (action === "start") {
            startMutation.mutate();
            return;
          }
          missMutation.mutate();
        }}
      />

      {action === "miss" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Miss Reason</CardTitle>
          </CardHeader>
          <CardContent>
            <FormTextareaField label="Reason" value={missNotes} onChange={setMissNotes} />
          </CardContent>
        </Card>
      ) : null}

      <Sheet open={isCompleteOpen} onOpenChange={setIsCompleteOpen}>
        <SheetContent side="right" className="w-[95vw] overflow-y-auto sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>Complete Pickup Task</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            <FieldGrid>
              <FormTextField label="Actual Weight (kg)" type="number" value={completeForm.actual_weight_kg} onChange={(value) => setCompleteForm((prev) => ({ ...prev, actual_weight_kg: value }))} />
              <FormSelectField label="Waste Category" value={completeForm.waste_category} options={WASTE_CATEGORIES.map((item) => ({ label: item, value: item }))} onChange={(value) => setCompleteForm((prev) => ({ ...prev, waste_category: value }))} />
              <FormSelectField label="Contamination" value={completeForm.contamination_flag} options={[{ label: "No", value: "false" }, { label: "Yes", value: "true" }]} onChange={(value) => setCompleteForm((prev) => ({ ...prev, contamination_flag: value }))} />
              <FormTextField label="Proof Photo URL" value={completeForm.photo_url} onChange={(value) => setCompleteForm((prev) => ({ ...prev, photo_url: value }))} />
            </FieldGrid>
            <FormTextareaField label="Completion Notes" value={completeForm.notes} onChange={(value) => setCompleteForm((prev) => ({ ...prev, notes: value }))} />
            <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
              <Button variant="outline" onClick={() => setIsCompleteOpen(false)}>Cancel</Button>
              <Button onClick={() => completeMutation.mutate()} disabled={completeMutation.isPending || !isInProgress}>
                {completeMutation.isPending ? "Completing..." : "Complete Task"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
