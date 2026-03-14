import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { TenantSummary } from "@/types/platform-admin";
import { formatDateTime } from "@/lib/utils";

export function TenantSummaryHeader({ tenant }: { tenant: TenantSummary }) {
  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-lg font-semibold text-slate-900">{tenant.name}</p>
            <p className="text-sm text-slate-600">{tenant.slug}</p>
          </div>
          <Badge variant={tenant.is_active ? "default" : "secondary"}>{tenant.is_active ? "Active" : "Inactive"}</Badge>
        </div>
        <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2 lg:grid-cols-4">
          <p>Cities: {tenant.linked_city_count}</p>
          <p>Admins: {tenant.linked_admin_count}</p>
          <p>Users: {tenant.linked_user_count}</p>
          <p>Workers: {tenant.linked_worker_count}</p>
        </div>
        <p className="text-xs text-slate-500">Last activity: {formatDateTime(tenant.last_activity_at)}</p>
      </CardContent>
    </Card>
  );
}
