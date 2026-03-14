"use client";

import { useQuery } from "@tanstack/react-query";

import { FeatureFlagTable } from "@/components/platform-admin/feature-flag-table";
import { PlatformAdminGuard } from "@/components/platform-admin/platform-admin-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/ui-extensions/error-state";
import { LoadingState } from "@/components/ui-extensions/loading-state";
import { PageHeader } from "@/components/ui-extensions/page-header";
import { getPlatformFeatureFlags } from "@/lib/api/services";
import { queryKeys } from "@/types/query-keys";

export default function PlatformFeatureFlagsPage() {
  const flagsQuery = useQuery({
    queryKey: queryKeys.platformAdmin.featureFlags,
    queryFn: () => getPlatformFeatureFlags(),
  });

  return (
    <PlatformAdminGuard>
      {flagsQuery.isLoading ? (
        <LoadingState title="Loading feature flags" description="Fetching platform-level feature rollout matrix." />
      ) : flagsQuery.isError ? (
        <ErrorState title="Unable to load feature flags" description="Please retry." onRetry={() => void flagsQuery.refetch()} />
      ) : (
        <div className="space-y-6">
          <PageHeader
            title="Feature Flags"
            description="Tenant visibility and environment scope for platform capabilities. Current mode is safe view-only."
          />

          <FeatureFlagTable rows={flagsQuery.data ?? []} />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Flag Management Mode</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-700">
              Feature toggles are currently exposed as view-only records until mutation endpoints and rollout safeguards are finalized.
            </CardContent>
          </Card>
        </div>
      )}
    </PlatformAdminGuard>
  );
}
