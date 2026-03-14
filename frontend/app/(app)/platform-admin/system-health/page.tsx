"use client";

import { useQuery } from "@tanstack/react-query";

import { PlatformAdminGuard } from "@/components/platform-admin/platform-admin-guard";
import { HealthStatusCard } from "@/components/platform-admin/health-status-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/ui-extensions/error-state";
import { LoadingState } from "@/components/ui-extensions/loading-state";
import { PageHeader } from "@/components/ui-extensions/page-header";
import { getPlatformSystemHealth } from "@/lib/api/services";
import { queryKeys } from "@/types/query-keys";

export default function PlatformSystemHealthPage() {
  const healthQuery = useQuery({
    queryKey: queryKeys.platformAdmin.systemHealth,
    queryFn: () => getPlatformSystemHealth(),
    refetchInterval: 60000,
  });

  return (
    <PlatformAdminGuard>
      {healthQuery.isLoading ? (
        <LoadingState title="Loading system health" description="Checking API, auth, and database statuses." />
      ) : healthQuery.isError || !healthQuery.data ? (
        <ErrorState title="Unable to load system health" description="Please retry." onRetry={() => void healthQuery.refetch()} />
      ) : (
        <div className="space-y-6">
          <PageHeader title="System Health" description="Deployment-oriented health and service readiness summary." />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Overall Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm text-slate-700">
              <p>Status: {healthQuery.data.overall_status}</p>
              <p>Environment: {healthQuery.data.environment}</p>
              <p>Project: {healthQuery.data.project_name}</p>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            {healthQuery.data.services.map((service) => (
              <HealthStatusCard key={service.service} status={service} />
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Deployment Metadata</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(healthQuery.data.deployment_meta).map(([key, value]) => (
                <p key={key}>{key.replaceAll("_", " ")}: {value}</p>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </PlatformAdminGuard>
  );
}
