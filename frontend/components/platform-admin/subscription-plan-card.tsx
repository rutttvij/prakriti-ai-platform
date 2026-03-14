import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PlatformSubscriptionItem } from "@/types/platform-admin";

export function SubscriptionPlanCard({ item }: { item: PlatformSubscriptionItem }) {
  return (
    <Card>
      <CardHeader className="space-y-2 pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">{item.tenant_name}</CardTitle>
          <Badge variant="outline">{item.plan_name}</Badge>
        </div>
        <p className="text-xs text-slate-500">Tenant ID: {item.tenant_id}</p>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-700">
        <p>Billing: {item.billing_status}</p>
        <p>Renewal: {item.renewal_status}</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <p>Users: {item.limits.users}</p>
          <p>Workers: {item.limits.workers}</p>
          <p>Cities: {item.limits.cities}</p>
          <p>Storage (GB): {item.limits.storage_gb}</p>
          <p>Exports / month: {item.limits.exports_per_month}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {item.feature_entitlements.map((feature) => (
            <Badge key={feature} variant="secondary">{feature}</Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
