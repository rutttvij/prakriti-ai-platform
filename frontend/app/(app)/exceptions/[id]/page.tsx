"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { ExceptionActionBar } from "@/components/monitoring/exception-action-bar";
import { ExceptionDetailPanel } from "@/components/monitoring/exception-detail-panel";
import { ExceptionStatusTimeline } from "@/components/monitoring/exception-status-timeline";
import { LinkedEntityReferenceCard } from "@/components/monitoring/linked-entity-reference-card";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui-extensions/error-state";
import { LoadingState } from "@/components/ui-extensions/loading-state";
import { PageHeader } from "@/components/ui-extensions/page-header";
import { useIssueStatusState } from "@/hooks/use-issue-status-state";
import { getMonitoringData } from "@/lib/monitoring/query";
import { withStatusOverrides } from "@/lib/monitoring/utils";

export default function ExceptionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const decodedId = decodeURIComponent(id);

  const query = useQuery({ queryKey: ["monitoring", "bundle", "exception-detail"], queryFn: () => getMonitoringData({}), refetchInterval: 120000 });
  const { statusMap, acknowledge, escalate, resolve } = useIssueStatusState("exceptions");

  const exceptionItem = useMemo(() => {
    const exceptions = withStatusOverrides(query.data?.exceptions ?? [], statusMap);
    return exceptions.find((item) => item.id === decodedId) ?? null;
  }, [decodedId, query.data?.exceptions, statusMap]);

  if (query.isLoading) return <LoadingState title="Loading exception" description="Fetching exception context." />;
  if (query.isError) return <ErrorState title="Unable to load exception" description="Please retry." onRetry={() => void query.refetch()} />;
  if (!exceptionItem) return <ErrorState title="Exception not found" description="This exception may have been resolved or no longer applies." onRetry={() => void query.refetch()} />;

  return (
    <div className="space-y-6">
      <PageHeader title="Exception Detail" description={exceptionItem.id} actions={<Button asChild variant="outline"><Link href="/exceptions">Back to Exceptions</Link></Button>} />

      <ExceptionDetailPanel item={exceptionItem} />
      <ExceptionStatusTimeline status={exceptionItem.status} />

      <ExceptionActionBar
        onAcknowledge={() => {
          acknowledge(exceptionItem.id);
          toast.success("Exception acknowledged");
        }}
        onResolve={() => {
          resolve(exceptionItem.id);
          toast.success("Exception resolved");
        }}
        onEscalate={() => {
          escalate(exceptionItem.id);
          toast.success("Exception escalated");
        }}
      />

      <LinkedEntityReferenceCard item={exceptionItem} />
    </div>
  );
}
