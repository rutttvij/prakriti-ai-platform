import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui-extensions/status-badge";
import { SeverityBadge } from "@/components/monitoring/severity-badge";
import type { ExceptionItem } from "@/types/monitoring";
import { formatDateTime } from "@/lib/utils";

export function ExceptionDetailPanel({ item }: { item: ExceptionItem }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Exception Detail</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-700">
        <div className="flex flex-wrap items-center gap-2">
          <SeverityBadge severity={item.severity} />
          <StatusBadge value={item.status} />
          <StatusBadge value={item.exception_group} />
        </div>
        <p className="text-base font-semibold text-slate-900">{item.title}</p>
        <p>{item.description}</p>
        <p><span className="text-slate-500">Exception Code:</span> {item.exception_code}</p>
        <p><span className="text-slate-500">Created:</span> {formatDateTime(item.created_at)}</p>
        <p><span className="text-slate-500">Assigned Owner:</span> {item.assigned_owner_id ?? "Unassigned"}</p>
        <p><span className="text-slate-500">Recommended Action:</span> {item.recommended_action ?? "Review with operations owner."}</p>
      </CardContent>
    </Card>
  );
}
