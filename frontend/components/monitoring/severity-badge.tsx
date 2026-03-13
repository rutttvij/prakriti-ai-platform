import { Badge } from "@/components/ui/badge";
import type { MonitoringSeverity } from "@/types/monitoring";

export function SeverityBadge({ severity }: { severity: MonitoringSeverity }) {
  if (severity === "CRITICAL") {
    return <Badge variant="destructive">Critical</Badge>;
  }
  if (severity === "HIGH") {
    return <Badge className="bg-orange-100 text-orange-800">High</Badge>;
  }
  if (severity === "MEDIUM") {
    return <Badge variant="secondary">Medium</Badge>;
  }
  return <Badge variant="outline">Low</Badge>;
}
