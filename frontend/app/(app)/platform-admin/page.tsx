"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { MetricCardGrid } from "@/components/platform-admin/metric-card-grid";
import { PlatformAdminGuard } from "@/components/platform-admin/platform-admin-guard";
import { HealthStatusCard } from "@/components/platform-admin/health-status-card";
import { AuditLogTable } from "@/components/platform-admin/audit-log-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui-extensions/page-header";
import { LoadingState } from "@/components/ui-extensions/loading-state";
import { ErrorState } from "@/components/ui-extensions/error-state";
import { getPlatformAdminDashboard } from "@/lib/api/services";
import { queryKeys } from "@/types/query-keys";
import { formatDateTime } from "@/lib/utils";

export default function PlatformAdminDashboardPage() {
  const dashboardQuery = useQuery({
    queryKey: queryKeys.platformAdmin.dashboard,
    queryFn: () => getPlatformAdminDashboard(),
    refetchInterval: 120000,
  });

  return (
    <PlatformAdminGuard>
      {dashboardQuery.isLoading ? (
        <LoadingState title="Loading platform admin dashboard" description="Gathering multi-tenant control center metrics." />
      ) : dashboardQuery.isError || !dashboardQuery.data ? (
        <ErrorState
          title="Unable to load platform admin dashboard"
          description="Please retry after checking service health."
          onRetry={() => void dashboardQuery.refetch()}
        />
      ) : (
        <div className="space-y-6">
          <PageHeader
            title="Platform Admin Control Center"
            description="Multi-tenant monitoring, onboarding oversight, subscriptions, and deployment-oriented controls."
            actions={
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline"><Link href="/platform-admin/system-health">System Health</Link></Button>
                <Button asChild><Link href="/platform-admin/tenants">Manage Tenants</Link></Button>
              </div>
            }
          />

          <MetricCardGrid
            items={[
              { title: "Total Tenants", value: String(dashboardQuery.data.metrics.total_tenants) },
              { title: "Cities Onboarded", value: String(dashboardQuery.data.metrics.total_cities_onboarded) },
              { title: "Active Users", value: String(dashboardQuery.data.metrics.active_users) },
              { title: "Active Workers", value: String(dashboardQuery.data.metrics.active_workers) },
              { title: "Pickup Tasks", value: String(dashboardQuery.data.metrics.total_pickup_tasks) },
            ]}
          />

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <AuditLogTable rows={dashboardQuery.data.recent_audit_activity} />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Latest Onboarding Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {dashboardQuery.data.latest_onboarding_actions.map((action) => (
                  <div key={action.id} className="rounded-md border border-slate-200 p-3">
                    <p className="font-medium text-slate-900">{action.step.replaceAll("_", " ")}</p>
                    <p className="text-slate-600">{action.entity_label}</p>
                    <p className="text-xs text-slate-500">{formatDateTime(action.created_at)}</p>
                  </div>
                ))}
                {!dashboardQuery.data.latest_onboarding_actions.length ? (
                  <p className="text-slate-500">No onboarding actions yet.</p>
                ) : null}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {dashboardQuery.data.system_health_summary.services.map((item) => (
              <HealthStatusCard key={item.service} status={item} />
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Subscription Overview</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-700">
              <p>Status: {String(dashboardQuery.data.subscription_overview.status ?? "-")}</p>
              <p>Billing enabled: {String(dashboardQuery.data.subscription_overview.billing_enabled ?? false)}</p>
              <p>Total subscriptions: {String(dashboardQuery.data.subscription_overview.total_subscriptions ?? 0)}</p>
            </CardContent>
          </Card>
        </div>
      )}
    </PlatformAdminGuard>
  );
}
