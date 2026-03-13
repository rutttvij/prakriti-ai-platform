"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { ExceptionActionBar } from "@/components/monitoring/exception-action-bar";
import { ExceptionStatusTimeline } from "@/components/monitoring/exception-status-timeline";
import { LinkedEntityReferenceCard } from "@/components/monitoring/linked-entity-reference-card";
import { SeverityBadge } from "@/components/monitoring/severity-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/ui-extensions/error-state";
import { LoadingState } from "@/components/ui-extensions/loading-state";
import { PageHeader } from "@/components/ui-extensions/page-header";
import { StatusBadge } from "@/components/ui-extensions/status-badge";
import { useIssueStatusState } from "@/hooks/use-issue-status-state";
import { getMonitoringData } from "@/lib/monitoring/query";
import { withStatusOverrides } from "@/lib/monitoring/utils";
import { formatDateTime } from "@/lib/utils";

export default function AlertDetailPage() {
  const { id } = useParams<{ id: string }>();
  const decodedId = decodeURIComponent(id);

  const query = useQuery({ queryKey: ["monitoring", "bundle", "alert-detail"], queryFn: () => getMonitoringData({}), refetchInterval: 120000 });
  const { statusMap, acknowledge, escalate, resolve } = useIssueStatusState("alerts");

  const alertItem = useMemo(() => {
    const alerts = withStatusOverrides(query.data?.alerts ?? [], statusMap);
    return alerts.find((item) => item.id === decodedId) ?? null;
  }, [decodedId, query.data?.alerts, statusMap]);

  if (query.isLoading) return <LoadingState title="Loading alert" description="Fetching alert context." />;
  if (query.isError) return <ErrorState title="Unable to load alert" description="Please retry." onRetry={() => void query.refetch()} />;
  if (!alertItem) return <ErrorState title="Alert not found" description="This alert may have been resolved or no longer applies." onRetry={() => void query.refetch()} />;

  return (
    <div className="space-y-6">
      <PageHeader title="Alert Detail" description={alertItem.id} actions={<Button asChild variant="outline"><Link href="/alerts">Back to Alerts</Link></Button>} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{alertItem.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-700">
          <div className="flex flex-wrap items-center gap-2">
            <SeverityBadge severity={alertItem.severity} />
            <StatusBadge value={alertItem.status} />
            <StatusBadge value={alertItem.type} />
          </div>
          <p>{alertItem.description}</p>
          <p><span className="text-slate-500">Created:</span> {formatDateTime(alertItem.created_at)}</p>
          <p><span className="text-slate-500">Assigned Owner:</span> {alertItem.assigned_owner_id ?? "Unassigned"}</p>
          <p><span className="text-slate-500">Recommended Action:</span> {alertItem.recommended_action ?? "Investigate and close the alert."}</p>
        </CardContent>
      </Card>

      <ExceptionStatusTimeline status={alertItem.status} />

      <ExceptionActionBar
        onAcknowledge={() => {
          acknowledge(alertItem.id);
          toast.success("Alert acknowledged");
        }}
        onResolve={() => {
          resolve(alertItem.id);
          toast.success("Alert marked resolved");
        }}
        onEscalate={() => {
          escalate(alertItem.id);
          toast.success("Alert escalated");
        }}
      />

      <LinkedEntityReferenceCard item={alertItem} />
    </div>
  );
}
