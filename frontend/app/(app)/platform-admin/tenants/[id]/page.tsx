"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { PlatformAdminGuard } from "@/components/platform-admin/platform-admin-guard";
import { TenantSummaryHeader } from "@/components/platform-admin/tenant-summary-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/ui-extensions/error-state";
import { LoadingState } from "@/components/ui-extensions/loading-state";
import { PageHeader } from "@/components/ui-extensions/page-header";
import { getPlatformTenantDetail } from "@/lib/api/services";
import { queryKeys } from "@/types/query-keys";

export default function PlatformTenantDetailPage() {
  const params = useParams<{ id: string }>();
  const tenantId = useMemo(() => (typeof params.id === "string" ? params.id : ""), [params.id]);

  const detailQuery = useQuery({
    queryKey: queryKeys.platformAdmin.tenantDetail(tenantId),
    queryFn: () => getPlatformTenantDetail(tenantId),
    enabled: Boolean(tenantId),
  });

  return (
    <PlatformAdminGuard>
      {detailQuery.isLoading ? (
        <LoadingState title="Loading tenant detail" description="Gathering tenant metadata, cities, and admins." />
      ) : detailQuery.isError || !detailQuery.data ? (
        <ErrorState title="Unable to load tenant" description="Please retry." onRetry={() => void detailQuery.refetch()} />
      ) : (
        <div className="space-y-6">
          <PageHeader
            title="Tenant Detail"
            description="Tenant scope, linked city/admin context, and activity metadata for platform operations."
          />

          <TenantSummaryHeader tenant={detailQuery.data.summary} />

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Linked Cities</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {detailQuery.data.cities.map((city) => (
                  <div key={city.id} className="rounded-md border border-slate-200 p-3">
                    <p className="font-medium text-slate-900">{city.name}</p>
                    <p className="text-slate-600">{city.state}, {city.country}</p>
                    <Badge variant={city.is_active ? "default" : "secondary"}>{city.is_active ? "Active" : "Inactive"}</Badge>
                  </div>
                ))}
                {!detailQuery.data.cities.length ? <p className="text-slate-500">No linked cities.</p> : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Linked Admins</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {detailQuery.data.admins.map((admin) => (
                  <div key={admin.id} className="rounded-md border border-slate-200 p-3">
                    <p className="font-medium text-slate-900">{admin.full_name}</p>
                    <p className="text-slate-600">{admin.email}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {admin.role_codes.map((role) => (
                        <Badge key={`${admin.id}-${role}`} variant="outline">{role}</Badge>
                      ))}
                    </div>
                  </div>
                ))}
                {!detailQuery.data.admins.length ? <p className="text-slate-500">No tenant admins found.</p> : null}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Activity Summary</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(detailQuery.data.activity_summary).map(([key, value]) => (
                <p key={key}>{key.replaceAll("_", " ")}: {value}</p>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Configuration Metadata</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(detailQuery.data.configuration_metadata).map(([key, value]) => (
                <p key={key}>{key.replaceAll("_", " ")}: {value}</p>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </PlatformAdminGuard>
  );
}
