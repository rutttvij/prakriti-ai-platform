import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { HealthServiceStatus } from "@/types/platform-admin";
import { formatDateTime } from "@/lib/utils";

function badgeVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (status === "healthy") return "default";
  if (status === "degraded") return "secondary";
  if (status === "down") return "destructive";
  return "outline";
}

export function HealthStatusCard({ status }: { status: HealthServiceStatus }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">{status.service.replaceAll("_", " ")}</CardTitle>
          <Badge variant={badgeVariant(status.status)}>{status.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-1 text-sm text-slate-600">
        <p>{status.detail ?? "No additional details."}</p>
        <p className="text-xs text-slate-500">Checked: {formatDateTime(status.checked_at)}</p>
      </CardContent>
    </Card>
  );
}
