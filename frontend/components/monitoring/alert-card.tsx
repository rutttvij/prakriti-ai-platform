import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui-extensions/status-badge";
import { SeverityBadge } from "@/components/monitoring/severity-badge";
import type { AlertItem } from "@/types/monitoring";
import { formatDateTime } from "@/lib/utils";

export function AlertCard({ item }: { item: AlertItem }) {
  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-slate-900">{item.title}</p>
          <div className="flex items-center gap-2">
            <SeverityBadge severity={item.severity} />
            <StatusBadge value={item.status} />
          </div>
        </div>
        <p className="text-sm text-slate-700">{item.description}</p>
        <p className="text-xs text-slate-500">{formatDateTime(item.created_at)}</p>
        <p className="text-xs text-slate-600">Owner: {item.assigned_owner_id ?? "Unassigned"}</p>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link href={`/alerts/${encodeURIComponent(item.id)}`} className="text-emerald-700 hover:underline">Review alert</Link>
          <Link href={item.href} className="text-slate-700 hover:underline">Open entity</Link>
        </div>
      </CardContent>
    </Card>
  );
}
